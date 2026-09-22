-- Menores: consentimento de imagem só pelo responsável vinculado (ou admin).
-- Cadastro de menor não grava mais "granted" no próprio ato.

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
  v_birth date;
  v_is_minor boolean := false;
  v_is_linked_guardian boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT birth_date INTO v_birth
  FROM public.profiles
  WHERE id = p_profile_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil não encontrado';
  END IF;

  v_is_minor := (
    v_birth IS NOT NULL
    AND EXTRACT(YEAR FROM age(v_birth)) < 18
  );

  v_is_linked_guardian := EXISTS (
    SELECT 1
    FROM public.guardian_links gl
    WHERE gl.student_id = p_profile_id
      AND gl.guardian_id = auth.uid()
      AND gl.status = 'active'
  );

  IF public.is_admin() AND auth.uid() IS DISTINCT FROM p_profile_id THEN
    v_role := 'admin';
  ELSIF v_is_linked_guardian THEN
    v_role := 'guardian';
  ELSIF auth.uid() = p_profile_id THEN
    IF v_is_minor THEN
      RAISE EXCEPTION
        'Consentimento de imagem de menor deve ser autorizado pelo responsável legal vinculado no portal';
    END IF;
    v_role := 'self';
  ELSE
    RAISE EXCEPTION 'Sem permissão para registrar consentimento deste perfil';
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
  v_birth date;
  v_is_minor boolean := false;
BEGIN
  v_as_guardian :=
    COALESCE(NEW.raw_user_meta_data->>'signup_as', '') = 'guardian'
    OR EXISTS (
      SELECT 1 FROM public.guardian_links
      WHERE status = 'pending' AND lower(invited_email) = v_email
    );

  v_g1_name := NULLIF(btrim(COALESCE(NEW.raw_user_meta_data->>'guardian_name', '')), '');
  v_g1_phone := NULLIF(btrim(COALESCE(NEW.raw_user_meta_data->>'guardian_phone', '')), '');
  v_g2_name := NULLIF(btrim(COALESCE(NEW.raw_user_meta_data->>'guardian2_name', '')), '');
  v_g2_phone := NULLIF(btrim(COALESCE(NEW.raw_user_meta_data->>'guardian2_phone', '')), '');
  v_consent := lower(btrim(COALESCE(NEW.raw_user_meta_data->>'image_consent', 'pending')));
  v_birth := COALESCE((NEW.raw_user_meta_data->>'birth_date')::date, NULL);
  v_is_minor := (v_birth IS NOT NULL AND EXTRACT(YEAR FROM age(v_birth)) < 18);

  -- Menor: consentimento fica pendente até o responsável vinculado autorizar
  IF v_is_minor THEN
    v_consent := 'pending';
  END IF;

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
      guardian_name, guardian_phone, role, email, approval_status,
      emergency_contacts, image_consent_status
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      '',
      public.next_registration_number(),
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
      NULL, NULL,
      COALESCE(NEW.raw_user_meta_data->>'city', ''),
      COALESCE(NEW.raw_user_meta_data->>'state', ''),
      COALESCE(NEW.raw_user_meta_data->>'cpf', ''),
      COALESCE(NEW.raw_user_meta_data->>'rg', ''),
      NULL, NULL, NULL,
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
      guardian_name, guardian_phone, role, email, approval_status, emergency_contacts,
      image_consent_status, image_consent_at, image_consent_by_name,
      image_consent_by_role, image_consent_version
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'instrument', ''),
      public.next_registration_number(),
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
      v_birth,
      COALESCE((NEW.raw_user_meta_data->>'valid_until')::date, NULL),
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
      CASE
        WHEN v_consent IN ('granted', 'denied') THEN
          NULLIF(btrim(COALESCE(NEW.raw_user_meta_data->>'image_consent_by_name', '')), '')
        ELSE NULL
      END,
      CASE
        WHEN v_consent IN ('granted', 'denied') THEN 'self'
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
        'self',
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
