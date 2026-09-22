-- Múltiplos responsáveis de emergência + consentimento de uso de imagem (LGPD art. 14)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS emergency_contacts jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS image_consent_status text NOT NULL DEFAULT 'pending';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_image_consent_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_image_consent_status_check
  CHECK (image_consent_status IN ('pending', 'granted', 'denied', 'revoked'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS image_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS image_consent_by_name text,
  ADD COLUMN IF NOT EXISTS image_consent_by_role text,
  ADD COLUMN IF NOT EXISTS image_consent_version text;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_image_consent_by_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_image_consent_by_role_check
  CHECK (
    image_consent_by_role IS NULL
    OR image_consent_by_role IN ('self', 'guardian')
  );

COMMENT ON COLUMN public.profiles.emergency_contacts IS
  'Responsáveis/contatos de emergência: [{name, phone, relationship}]';
COMMENT ON COLUMN public.profiles.image_consent_status IS
  'LGPD uso de imagem: pending|granted|denied|revoked';

CREATE TABLE IF NOT EXISTS public.image_consent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('granted', 'denied', 'revoked')),
  actor_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  actor_name text,
  actor_role text CHECK (actor_role IS NULL OR actor_role IN ('self', 'guardian', 'admin')),
  consent_version text NOT NULL,
  consent_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS image_consent_events_profile_idx
  ON public.image_consent_events (profile_id, created_at DESC);

ALTER TABLE public.image_consent_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "image_consent_events_select_own_or_admin" ON public.image_consent_events;
CREATE POLICY "image_consent_events_select_own_or_admin"
  ON public.image_consent_events FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "image_consent_events_insert_own_or_admin" ON public.image_consent_events;
CREATE POLICY "image_consent_events_insert_own_or_admin"
  ON public.image_consent_events FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid() OR public.is_admin());

CREATE OR REPLACE FUNCTION public.merge_emergency_contacts(a jsonb, b jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_result jsonb := '[]'::jsonb;
  v_item jsonb;
  v_key text;
  v_seen text[] := ARRAY[]::text[];
BEGIN
  FOR v_item IN
    SELECT value FROM jsonb_array_elements(COALESCE(a, '[]'::jsonb))
    UNION ALL
    SELECT value FROM jsonb_array_elements(COALESCE(b, '[]'::jsonb))
  LOOP
    v_key := lower(btrim(COALESCE(v_item->>'name', '')))
      || '|'
      || regexp_replace(COALESCE(v_item->>'phone', ''), '\D', '', 'g');
    IF btrim(COALESCE(v_item->>'name', '')) = '' OR v_key = ANY (v_seen) THEN
      CONTINUE;
    END IF;
    v_seen := array_append(v_seen, v_key);
    v_result := v_result || jsonb_build_array(
      jsonb_build_object(
        'name', btrim(COALESCE(v_item->>'name', '')),
        'phone', btrim(COALESCE(v_item->>'phone', '')),
        'relationship', COALESCE(NULLIF(btrim(v_item->>'relationship'), ''), 'Responsável')
      )
    );
  END LOOP;
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_student_guardian_contact(p_student_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_linked jsonb := '[]'::jsonb;
  v_merged jsonb;
  v_first_name text;
  v_first_phone text;
BEGIN
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'name', btrim(g.full_name),
        'phone', '',
        'relationship', COALESCE(NULLIF(btrim(gl.relationship), ''), 'Responsável legal')
      )
      ORDER BY gl.activated_at DESC NULLS LAST, gl.created_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_linked
  FROM public.guardian_links gl
  JOIN public.profiles g ON g.id = gl.guardian_id
  WHERE gl.student_id = p_student_id
    AND gl.status = 'active'
    AND gl.guardian_id IS NOT NULL
    AND COALESCE(btrim(g.full_name), '') <> '';

  IF jsonb_array_length(v_linked) = 0 THEN
    RETURN;
  END IF;

  SELECT public.merge_emergency_contacts(COALESCE(p.emergency_contacts, '[]'::jsonb), v_linked)
  INTO v_merged
  FROM public.profiles p
  WHERE p.id = p_student_id;

  v_first_name := NULLIF(btrim(v_merged->0->>'name'), '');
  v_first_phone := NULLIF(btrim(v_merged->0->>'phone'), '');

  UPDATE public.profiles
  SET
    emergency_contacts = COALESCE(v_merged, '[]'::jsonb),
    guardian_name = COALESCE(v_first_name, guardian_name),
    guardian_phone = COALESCE(v_first_phone, guardian_phone),
    updated_at = now()
  WHERE id = p_student_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_image_consent(
  p_profile_id uuid,
  p_action text,
  p_actor_name text,
  p_actor_role text,
  p_consent_version text,
  p_consent_text text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_action text := lower(btrim(p_action));
  v_role text := lower(btrim(COALESCE(p_actor_role, 'self')));
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF auth.uid() IS DISTINCT FROM p_profile_id AND NOT public.is_admin() THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.guardian_links gl
      WHERE gl.student_id = p_profile_id
        AND gl.guardian_id = auth.uid()
        AND gl.status = 'active'
    ) THEN
      RAISE EXCEPTION 'Sem permissão para registrar consentimento deste perfil';
    END IF;
    v_role := 'guardian';
  END IF;

  IF v_action NOT IN ('granted', 'denied', 'revoked') THEN
    RAISE EXCEPTION 'Ação de consentimento inválida';
  END IF;

  IF v_role NOT IN ('self', 'guardian', 'admin') THEN
    RAISE EXCEPTION 'Papel do autor inválido';
  END IF;

  IF p_consent_version IS NULL OR btrim(p_consent_version) = '' THEN
    RAISE EXCEPTION 'Versão do termo obrigatória';
  END IF;

  IF p_consent_text IS NULL OR length(btrim(p_consent_text)) < 40 THEN
    RAISE EXCEPTION 'Texto do termo obrigatório para auditoria';
  END IF;

  INSERT INTO public.image_consent_events (
    profile_id, action, actor_user_id, actor_name, actor_role, consent_version, consent_text
  ) VALUES (
    p_profile_id,
    v_action,
    auth.uid(),
    NULLIF(btrim(p_actor_name), ''),
    v_role,
    btrim(p_consent_version),
    btrim(p_consent_text)
  );

  UPDATE public.profiles
  SET
    image_consent_status = v_action,
    image_consent_at = now(),
    image_consent_by_name = NULLIF(btrim(p_actor_name), ''),
    image_consent_by_role = CASE WHEN v_role = 'admin' THEN 'guardian' ELSE v_role END,
    image_consent_version = btrim(p_consent_version),
    updated_at = now()
  WHERE id = p_profile_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_image_consent(uuid, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.merge_emergency_contacts(jsonb, jsonb) TO authenticated;

DROP FUNCTION IF EXISTS public.verify_id_card(uuid);

CREATE OR REPLACE FUNCTION public.verify_id_card(member_id uuid)
RETURNS TABLE (
  full_name text,
  registration_number text,
  instrument text,
  valid_until date,
  city text,
  state text,
  role text,
  is_valid boolean,
  avatar_url text,
  birth_date date,
  cpf text,
  rg text,
  disability_info text,
  guardian_name text,
  guardian_phone text,
  emergency_contacts jsonb,
  image_consent_status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    p.full_name,
    p.registration_number,
    p.instrument,
    p.valid_until,
    p.city,
    p.state,
    p.role,
    (
      p.approval_status = 'approved'
      AND (p.valid_until IS NULL OR p.valid_until >= CURRENT_DATE)
    ) AS is_valid,
    p.avatar_url,
    p.birth_date,
    p.cpf,
    p.rg,
    p.disability_info,
    p.guardian_name,
    p.guardian_phone,
    COALESCE(p.emergency_contacts, '[]'::jsonb) AS emergency_contacts,
    COALESCE(p.image_consent_status, 'pending') AS image_consent_status
  FROM public.profiles p
  WHERE p.id = member_id
    AND p.approval_status = 'approved';
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_as_guardian boolean := false;
  v_email text := lower(COALESCE(NEW.email, ''));
  v_contacts jsonb := '[]'::jsonb;
  v_g1_name text;
  v_g1_phone text;
  v_g2_name text;
  v_g2_phone text;
  v_consent text;
BEGIN
  v_as_guardian :=
    COALESCE(NEW.raw_user_meta_data->>'signup_as', '') = 'guardian'
    OR EXISTS (
      SELECT 1 FROM public.guardian_links
      WHERE status = 'pending'
        AND lower(invited_email) = v_email
    );

  v_g1_name := NULLIF(btrim(COALESCE(NEW.raw_user_meta_data->>'guardian_name', '')), '');
  v_g1_phone := NULLIF(btrim(COALESCE(NEW.raw_user_meta_data->>'guardian_phone', '')), '');
  v_g2_name := NULLIF(btrim(COALESCE(NEW.raw_user_meta_data->>'guardian2_name', '')), '');
  v_g2_phone := NULLIF(btrim(COALESCE(NEW.raw_user_meta_data->>'guardian2_phone', '')), '');
  v_consent := lower(btrim(COALESCE(NEW.raw_user_meta_data->>'image_consent', 'pending')));

  IF v_g1_name IS NOT NULL THEN
    v_contacts := v_contacts || jsonb_build_array(jsonb_build_object(
      'name', v_g1_name,
      'phone', COALESCE(v_g1_phone, ''),
      'relationship', COALESCE(
        NULLIF(btrim(NEW.raw_user_meta_data->>'guardian_relationship'), ''),
        'Responsável legal'
      )
    ));
  END IF;

  IF v_g2_name IS NOT NULL THEN
    v_contacts := v_contacts || jsonb_build_array(jsonb_build_object(
      'name', v_g2_name,
      'phone', COALESCE(v_g2_phone, ''),
      'relationship', COALESCE(
        NULLIF(btrim(NEW.raw_user_meta_data->>'guardian2_relationship'), ''),
        'Responsável legal'
      )
    ));
  END IF;

  IF v_as_guardian THEN
    INSERT INTO public.profiles (
      id, full_name, instrument, registration_number, avatar_url,
      birth_date, valid_until, city, state, cpf, rg, disability_info,
      guardian_name, guardian_phone,
      role, email, approval_status,
      emergency_contacts, image_consent_status
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      '',
      public.next_registration_number(),
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
      NULL,
      NULL,
      COALESCE(NEW.raw_user_meta_data->>'city', ''),
      COALESCE(NEW.raw_user_meta_data->>'state', ''),
      COALESCE(NEW.raw_user_meta_data->>'cpf', ''),
      COALESCE(NEW.raw_user_meta_data->>'rg', ''),
      NULL,
      NULL,
      NULL,
      'guardian',
      COALESCE(NEW.email, ''),
      'pending',
      '[]'::jsonb,
      'pending'
    );

    UPDATE public.guardian_links
    SET guardian_id = NEW.id
    WHERE status = 'pending'
      AND lower(invited_email) = v_email
      AND (guardian_id IS NULL OR guardian_id = NEW.id);
  ELSE
    INSERT INTO public.profiles (
      id, full_name, instrument, registration_number, avatar_url,
      birth_date, valid_until, city, state, cpf, rg, disability_info,
      guardian_name, guardian_phone,
      role, email, approval_status,
      emergency_contacts,
      image_consent_status, image_consent_at, image_consent_by_name,
      image_consent_by_role, image_consent_version
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'instrument', ''),
      public.next_registration_number(),
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
      COALESCE((NEW.raw_user_meta_data->>'birth_date')::DATE, NULL),
      COALESCE((NEW.raw_user_meta_data->>'valid_until')::DATE, NULL),
      COALESCE(NEW.raw_user_meta_data->>'city', ''),
      COALESCE(NEW.raw_user_meta_data->>'state', ''),
      COALESCE(NEW.raw_user_meta_data->>'cpf', ''),
      COALESCE(NEW.raw_user_meta_data->>'rg', ''),
      COALESCE(NEW.raw_user_meta_data->>'disability_info', NULL),
      v_g1_name,
      v_g1_phone,
      'member',
      COALESCE(NEW.email, ''),
      'pending',
      v_contacts,
      CASE WHEN v_consent IN ('granted', 'denied') THEN v_consent ELSE 'pending' END,
      CASE WHEN v_consent IN ('granted', 'denied') THEN now() ELSE NULL END,
      NULLIF(btrim(COALESCE(NEW.raw_user_meta_data->>'image_consent_by_name', '')), ''),
      CASE
        WHEN v_consent IN ('granted', 'denied') THEN
          CASE
            WHEN COALESCE(NEW.raw_user_meta_data->>'image_consent_by_role', '') = 'guardian'
              THEN 'guardian'
            ELSE 'self'
          END
        ELSE NULL
      END,
      CASE
        WHEN v_consent IN ('granted', 'denied') THEN
          COALESCE(NULLIF(btrim(NEW.raw_user_meta_data->>'image_consent_version'), ''), 'bmb-image-v1-2026')
        ELSE NULL
      END
    );

    IF v_consent IN ('granted', 'denied') THEN
      INSERT INTO public.image_consent_events (
        profile_id, action, actor_user_id, actor_name, actor_role, consent_version, consent_text
      ) VALUES (
        NEW.id,
        v_consent,
        NEW.id,
        NULLIF(btrim(COALESCE(NEW.raw_user_meta_data->>'image_consent_by_name', '')), ''),
        CASE
          WHEN COALESCE(NEW.raw_user_meta_data->>'image_consent_by_role', '') = 'guardian'
            THEN 'guardian'
          ELSE 'self'
        END,
        COALESCE(NULLIF(btrim(NEW.raw_user_meta_data->>'image_consent_version'), ''), 'bmb-image-v1-2026'),
        COALESCE(
          NULLIF(btrim(NEW.raw_user_meta_data->>'image_consent_text'), ''),
          'Consentimento registrado no cadastro (texto na versão do termo).'
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Backfill: preenche emergency_contacts a partir de guardian_name/phone existentes
UPDATE public.profiles p
SET emergency_contacts = jsonb_build_array(
  jsonb_build_object(
    'name', btrim(p.guardian_name),
    'phone', COALESCE(btrim(p.guardian_phone), ''),
    'relationship', 'Responsável legal'
  )
)
WHERE COALESCE(btrim(p.guardian_name), '') <> ''
  AND (
    p.emergency_contacts IS NULL
    OR p.emergency_contacts = '[]'::jsonb
  );
