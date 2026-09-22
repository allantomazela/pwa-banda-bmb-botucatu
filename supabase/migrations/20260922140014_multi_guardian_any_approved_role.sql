-- Permite N responsáveis por aluno e N alunos por responsável.
-- Antes só role=guardian podia ser vinculado (admin/pai como BMB-0001 falhava).

CREATE OR REPLACE FUNCTION public.profile_can_be_linked_as_guardian(p_role text, p_birth_date date)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    p_role IS NOT NULL
    AND p_role IN (
      'guardian',
      'admin',
      'member',
      'professor',
      'honorary_member',
      'support_group'
    )
    AND (
      p_birth_date IS NULL
      OR EXTRACT(YEAR FROM age(p_birth_date)) >= 18
    );
$$;

CREATE OR REPLACE FUNCTION public.link_guardian_by_registration(
  p_student_id uuid,
  p_guardian_registration text,
  p_relationship text DEFAULT 'Responsável legal'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_reg text := upper(btrim(COALESCE(p_guardian_registration, '')));
  v_guardian_id uuid;
  v_guardian_email text;
  v_guardian_status text;
  v_guardian_role text;
  v_guardian_birth date;
  v_student_role text;
  v_id uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem vincular responsáveis';
  END IF;

  IF v_reg = '' THEN
    RAISE EXCEPTION 'Informe a matrícula do responsável';
  END IF;

  IF v_reg !~ '^BMB-' THEN
    v_reg := 'BMB-' || lpad(regexp_replace(v_reg, '\D', '', 'g'), 4, '0');
  END IF;

  SELECT id, email, approval_status, role, birth_date
  INTO v_guardian_id, v_guardian_email, v_guardian_status, v_guardian_role, v_guardian_birth
  FROM public.profiles
  WHERE upper(btrim(registration_number)) = v_reg
  LIMIT 1;

  IF v_guardian_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum cadastro encontrado com a matrícula %', v_reg;
  END IF;

  IF NOT public.profile_can_be_linked_as_guardian(v_guardian_role, v_guardian_birth) THEN
    RAISE EXCEPTION
      'A matrícula % não pode ser vinculada como responsável (precisa ser maior de idade com conta aprovada)',
      v_reg;
  END IF;

  IF v_guardian_status IS DISTINCT FROM 'approved' THEN
    RAISE EXCEPTION 'O responsável com matrícula % ainda não está aprovado', v_reg;
  END IF;

  SELECT role INTO v_student_role
  FROM public.profiles
  WHERE id = p_student_id;

  IF v_student_role IS NULL OR v_student_role NOT IN ('member', 'support_group') THEN
    RAISE EXCEPTION 'Vínculo permitido apenas para alunos ou grupo de apoio';
  END IF;

  IF v_guardian_id = p_student_id THEN
    RAISE EXCEPTION 'Não é possível vincular o responsável a si mesmo';
  END IF;

  -- Reativa vínculo existente ou cria novo (permite vários responsáveis no mesmo aluno)
  SELECT id INTO v_id
  FROM public.guardian_links
  WHERE student_id = p_student_id
    AND (
      guardian_id = v_guardian_id
      OR lower(invited_email) = lower(v_guardian_email)
    )
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE public.guardian_links
    SET
      status = 'active',
      guardian_id = v_guardian_id,
      invited_email = lower(v_guardian_email),
      relationship = COALESCE(NULLIF(btrim(p_relationship), ''), 'Responsável legal'),
      activated_at = now()
    WHERE id = v_id;
  ELSE
    INSERT INTO public.guardian_links (
      student_id, guardian_id, invited_email, relationship, status, created_by, activated_at
    )
    VALUES (
      p_student_id,
      v_guardian_id,
      lower(v_guardian_email),
      COALESCE(NULLIF(btrim(p_relationship), ''), 'Responsável legal'),
      'active',
      auth.uid(),
      now()
    )
    RETURNING id INTO v_id;
  END IF;

  PERFORM public.sync_student_guardian_contact(p_student_id);
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.invite_guardian_for_student(
  p_student_id uuid,
  p_email text,
  p_relationship text DEFAULT 'Responsável legal'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_email text := lower(btrim(p_email));
  v_id uuid;
  v_existing_role text;
  v_existing_id uuid;
  v_existing_birth date;
  v_existing_status text;
  v_student_role text;
  v_link_id uuid;
  v_link_status text;
  v_can_link boolean := false;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem convidar responsáveis';
  END IF;

  IF v_email IS NULL OR length(v_email) < 5 OR position('@' IN v_email) = 0 THEN
    RAISE EXCEPTION 'Informe um e-mail válido';
  END IF;

  SELECT id, role, birth_date, approval_status
  INTO v_existing_id, v_existing_role, v_existing_birth, v_existing_status
  FROM public.profiles
  WHERE lower(email) = v_email
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    IF NOT public.profile_can_be_linked_as_guardian(v_existing_role, v_existing_birth) THEN
      RAISE EXCEPTION 'Este e-mail pertence a um cadastro que não pode ser responsável';
    END IF;
    v_can_link := (v_existing_status = 'approved');
  END IF;

  SELECT role INTO v_student_role
  FROM public.profiles
  WHERE id = p_student_id;

  IF v_student_role IS NULL OR v_student_role NOT IN ('member', 'support_group') THEN
    RAISE EXCEPTION 'Só é possível vincular responsável a aluno ou membro do grupo de apoio';
  END IF;

  IF v_existing_id IS NOT NULL AND v_existing_id = p_student_id THEN
    RAISE EXCEPTION 'Não é possível vincular o responsável a si mesmo';
  END IF;

  SELECT id, status INTO v_link_id, v_link_status
  FROM public.guardian_links
  WHERE student_id = p_student_id
    AND lower(invited_email) = v_email
  ORDER BY
    CASE status WHEN 'active' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END,
    created_at DESC
  LIMIT 1;

  IF v_link_id IS NOT NULL AND v_link_status IN ('pending', 'active') THEN
    IF v_can_link THEN
      UPDATE public.guardian_links
      SET status = 'active',
          activated_at = COALESCE(activated_at, now()),
          guardian_id = v_existing_id,
          relationship = COALESCE(NULLIF(btrim(p_relationship), ''), relationship)
      WHERE id = v_link_id;
      PERFORM public.sync_student_guardian_contact(p_student_id);
    END IF;
    RETURN v_link_id;
  END IF;

  IF v_link_id IS NOT NULL AND v_link_status = 'revoked' THEN
    UPDATE public.guardian_links
    SET status = CASE WHEN v_can_link THEN 'active' ELSE 'pending' END,
        activated_at = CASE WHEN v_can_link THEN now() ELSE NULL END,
        guardian_id = CASE WHEN v_can_link THEN v_existing_id ELSE NULL END,
        relationship = COALESCE(NULLIF(btrim(p_relationship), ''), 'Responsável legal'),
        created_by = auth.uid()
    WHERE id = v_link_id
    RETURNING id INTO v_id;

    IF v_can_link THEN
      PERFORM public.sync_student_guardian_contact(p_student_id);
    END IF;
    RETURN v_id;
  END IF;

  INSERT INTO public.guardian_links (
    student_id, invited_email, relationship, status, created_by, guardian_id
  )
  VALUES (
    p_student_id,
    v_email,
    COALESCE(NULLIF(btrim(p_relationship), ''), 'Responsável legal'),
    CASE WHEN v_can_link THEN 'active' ELSE 'pending' END,
    auth.uid(),
    CASE WHEN v_can_link THEN v_existing_id ELSE NULL END
  )
  RETURNING id INTO v_id;

  IF v_can_link THEN
    UPDATE public.guardian_links
    SET activated_at = now()
    WHERE id = v_id;

    PERFORM public.sync_student_guardian_contact(p_student_id);
  END IF;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.profile_can_be_linked_as_guardian(text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.link_guardian_by_registration(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.invite_guardian_for_student(uuid, text, text) TO authenticated;
