-- Grupo de Apoio na carteirinha + vínculo de responsável por matrícula
-- e sincronização do nome do responsável na ficha do menor.

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('member', 'professor', 'admin', 'guardian', 'support_group'));

COMMENT ON CONSTRAINT profiles_role_check ON public.profiles IS
  'member=Aluno, professor, admin, guardian=Responsável Legal, support_group=Grupo de Apoio';

-- Copia nome do responsável ativo para o perfil do aluno (carteirinha)
CREATE OR REPLACE FUNCTION public.sync_student_guardian_contact(p_student_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_name text;
BEGIN
  SELECT g.full_name
  INTO v_name
  FROM public.guardian_links gl
  JOIN public.profiles g ON g.id = gl.guardian_id
  WHERE gl.student_id = p_student_id
    AND gl.status = 'active'
    AND gl.guardian_id IS NOT NULL
  ORDER BY gl.activated_at DESC NULLS LAST, gl.created_at DESC
  LIMIT 1;

  IF v_name IS NULL OR btrim(v_name) = '' THEN
    RETURN;
  END IF;

  UPDATE public.profiles
  SET
    guardian_name = btrim(v_name),
    updated_at = now()
  WHERE id = p_student_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_student_guardian_contact(uuid) TO authenticated;

-- Ao ativar vínculo (aprovação / convite), sincroniza contato na carteirinha
CREATE OR REPLACE FUNCTION public.activate_guardian_links_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r record;
BEGIN
  IF NEW.role = 'guardian'
     AND NEW.approval_status = 'approved'
     AND (OLD.approval_status IS DISTINCT FROM 'approved') THEN
    UPDATE public.guardian_links
    SET
      status = 'active',
      guardian_id = NEW.id,
      activated_at = COALESCE(activated_at, now())
    WHERE lower(invited_email) = lower(NEW.email)
      AND status = 'pending';

    FOR r IN
      SELECT student_id
      FROM public.guardian_links
      WHERE guardian_id = NEW.id AND status = 'active'
    LOOP
      PERFORM public.sync_student_guardian_contact(r.student_id);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

-- Admin vincula responsável já cadastrado pela matrícula (BMB-XXXX)
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
  v_student_role text;
  v_id uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem vincular responsáveis';
  END IF;

  IF v_reg = '' THEN
    RAISE EXCEPTION 'Informe a matrícula do responsável';
  END IF;

  -- Aceita com ou sem prefixo BMB-
  IF v_reg !~ '^BMB-' THEN
    v_reg := 'BMB-' || lpad(regexp_replace(v_reg, '\D', '', 'g'), 4, '0');
  END IF;

  SELECT id, email, approval_status
  INTO v_guardian_id, v_guardian_email, v_guardian_status
  FROM public.profiles
  WHERE upper(btrim(registration_number)) = v_reg
    AND role = 'guardian'
  LIMIT 1;

  IF v_guardian_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum responsável legal encontrado com a matrícula %', v_reg;
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

  -- Reativa vínculo existente revogado/pendente ou cria novo
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

GRANT EXECUTE ON FUNCTION public.link_guardian_by_registration(uuid, text, text) TO authenticated;

-- Convite por e-mail também sincroniza quando já existe conta guardian
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
  v_student_role text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem convidar responsáveis';
  END IF;

  IF v_email IS NULL OR length(v_email) < 5 THEN
    RAISE EXCEPTION 'Informe um e-mail válido';
  END IF;

  SELECT id, role INTO v_existing_id, v_existing_role
  FROM public.profiles
  WHERE lower(email) = v_email
  LIMIT 1;

  IF v_existing_role IS NOT NULL AND v_existing_role <> 'guardian' THEN
    RAISE EXCEPTION 'Este e-mail já pertence a um usuário que não é responsável';
  END IF;

  SELECT role INTO v_student_role
  FROM public.profiles
  WHERE id = p_student_id;

  IF v_student_role IS NULL OR v_student_role NOT IN ('member', 'support_group') THEN
    RAISE EXCEPTION 'Aluno não encontrado';
  END IF;

  INSERT INTO public.guardian_links (
    student_id, invited_email, relationship, status, created_by, guardian_id
  )
  VALUES (
    p_student_id,
    v_email,
    COALESCE(NULLIF(btrim(p_relationship), ''), 'Responsável legal'),
    'pending',
    auth.uid(),
    CASE WHEN v_existing_role = 'guardian' THEN v_existing_id ELSE NULL END
  )
  RETURNING id INTO v_id;

  IF v_existing_role = 'guardian' THEN
    UPDATE public.guardian_links
    SET status = 'active',
        activated_at = now(),
        guardian_id = v_existing_id
    WHERE id = v_id;

    PERFORM public.sync_student_guardian_contact(p_student_id);
  END IF;

  RETURN v_id;
END;
$$;
