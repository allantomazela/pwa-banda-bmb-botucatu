-- Telefone de contato do próprio membro + sync com phone nos responsáveis vinculados

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.profiles.phone IS
  'Telefone de contato do próprio cadastro (aparece na carteirinha de adultos/responsáveis).';

CREATE OR REPLACE FUNCTION public.sync_student_guardian_contact(p_student_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_linked jsonb := '[]'::jsonb;
  v_existing jsonb;
  v_merged jsonb := '[]'::jsonb;
  v_item jsonb;
  v_name text;
  v_phone text;
  v_rel text;
  v_seen text[] := ARRAY[]::text[];
  v_existing_phone text;
  v_first_name text;
  v_first_phone text;
BEGIN
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'name', btrim(g.full_name),
        'phone', COALESCE(NULLIF(btrim(g.phone), ''), ''),
        'relationship', COALESCE(NULLIF(btrim(gl.relationship), ''), 'Responsável legal')
      )
      ORDER BY gl.created_at ASC, gl.activated_at ASC NULLS LAST
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

  SELECT COALESCE(p.emergency_contacts, '[]'::jsonb)
  INTO v_existing
  FROM public.profiles p
  WHERE p.id = p_student_id;

  FOR v_item IN
    SELECT value FROM jsonb_array_elements(COALESCE(v_linked, '[]'::jsonb))
  LOOP
    v_name := btrim(COALESCE(v_item->>'name', ''));
    IF v_name = '' OR lower(v_name) = ANY (v_seen) THEN
      CONTINUE;
    END IF;
    v_seen := array_append(v_seen, lower(v_name));
    v_phone := btrim(COALESCE(v_item->>'phone', ''));
    IF v_phone = '' THEN
      SELECT NULLIF(btrim(e->>'phone'), '')
      INTO v_existing_phone
      FROM jsonb_array_elements(COALESCE(v_existing, '[]'::jsonb)) e
      WHERE lower(btrim(COALESCE(e->>'name', ''))) = lower(v_name)
      LIMIT 1;
      v_phone := COALESCE(v_existing_phone, '');
    END IF;
    v_rel := COALESCE(NULLIF(btrim(v_item->>'relationship'), ''), 'Responsável legal');
    v_merged := v_merged || jsonb_build_array(
      jsonb_build_object('name', v_name, 'phone', v_phone, 'relationship', v_rel)
    );
  END LOOP;

  FOR v_item IN
    SELECT value FROM jsonb_array_elements(COALESCE(v_existing, '[]'::jsonb))
  LOOP
    v_name := btrim(COALESCE(v_item->>'name', ''));
    IF v_name = '' OR lower(v_name) = ANY (v_seen) THEN
      CONTINUE;
    END IF;
    v_seen := array_append(v_seen, lower(v_name));
    v_merged := v_merged || jsonb_build_array(
      jsonb_build_object(
        'name', v_name,
        'phone', btrim(COALESCE(v_item->>'phone', '')),
        'relationship', COALESCE(NULLIF(btrim(v_item->>'relationship'), ''), 'Responsável legal')
      )
    );
  END LOOP;

  IF jsonb_array_length(v_merged) = 0 THEN
    RETURN;
  END IF;

  v_first_name := NULLIF(btrim(v_merged->0->>'name'), '');
  v_first_phone := NULLIF(btrim(v_merged->0->>'phone'), '');
  IF v_first_phone IS NULL THEN
    SELECT NULLIF(btrim(e->>'phone'), '')
    INTO v_first_phone
    FROM jsonb_array_elements(v_merged) e
    WHERE NULLIF(btrim(e->>'phone'), '') IS NOT NULL
    LIMIT 1;
  END IF;

  UPDATE public.profiles
  SET
    emergency_contacts = v_merged,
    guardian_name = COALESCE(v_first_name, guardian_name),
    guardian_phone = COALESCE(v_first_phone, guardian_phone),
    updated_at = now()
  WHERE id = p_student_id;
END;
$$;

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
  image_consent_status text,
  phone text
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
    COALESCE(p.image_consent_status, 'pending') AS image_consent_status,
    COALESCE(p.phone, '') AS phone
  FROM public.profiles p
  WHERE p.id = member_id
    AND p.approval_status = 'approved';
$$;

GRANT EXECUTE ON FUNCTION public.verify_id_card(uuid) TO anon, authenticated;

-- Ao atualizar telefone/nome do responsável, atualiza carteirinha dos menores vinculados
CREATE OR REPLACE FUNCTION public.resync_students_when_guardian_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r record;
BEGIN
  IF NEW.phone IS NOT DISTINCT FROM OLD.phone
     AND NEW.full_name IS NOT DISTINCT FROM OLD.full_name THEN
    RETURN NEW;
  END IF;

  FOR r IN
    SELECT student_id
    FROM public.guardian_links
    WHERE guardian_id = NEW.id
      AND status = 'active'
  LOOP
    PERFORM public.sync_student_guardian_contact(r.student_id);
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_resync_students_when_guardian_profile_changes ON public.profiles;
CREATE TRIGGER trg_resync_students_when_guardian_profile_changes
  AFTER UPDATE OF phone, full_name ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.resync_students_when_guardian_profile_changes();

-- Re-sincroniza contatos dos menores com vínculos ativos
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT DISTINCT student_id
    FROM public.guardian_links
    WHERE status = 'active'
      AND guardian_id IS NOT NULL
  LOOP
    PERFORM public.sync_student_guardian_contact(r.student_id);
  END LOOP;
END;
$$;
