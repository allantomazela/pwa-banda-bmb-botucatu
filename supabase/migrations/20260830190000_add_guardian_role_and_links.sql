-- Fase 2: role guardian + vínculos + RLS de assinatura pelo responsável

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('member', 'professor', 'admin', 'guardian'));

CREATE TABLE IF NOT EXISTS public.guardian_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id uuid REFERENCES public.profiles (id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  relationship text NOT NULL DEFAULT 'Responsável',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'revoked')),
  invited_email text NOT NULL,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  CONSTRAINT guardian_links_email_not_blank CHECK (length(btrim(invited_email)) > 3)
);

CREATE INDEX IF NOT EXISTS guardian_links_student_idx ON public.guardian_links (student_id);
CREATE INDEX IF NOT EXISTS guardian_links_guardian_idx ON public.guardian_links (guardian_id);
CREATE INDEX IF NOT EXISTS guardian_links_email_idx ON public.guardian_links (lower(invited_email));

-- Um aluno ativo por e-mail de convite (evita duplicar convites ativos/pendentes)
CREATE UNIQUE INDEX IF NOT EXISTS guardian_links_student_email_active_uidx
  ON public.guardian_links (student_id, lower(invited_email))
  WHERE status IN ('pending', 'active');

CREATE UNIQUE INDEX IF NOT EXISTS guardian_links_guardian_student_active_uidx
  ON public.guardian_links (guardian_id, student_id)
  WHERE status = 'active' AND guardian_id IS NOT NULL;

ALTER TABLE public.guardian_links ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_active_guardian_of(p_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.guardian_links gl
    WHERE gl.student_id = p_student_id
      AND gl.guardian_id = auth.uid()
      AND gl.status = 'active'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_active_guardian_of(uuid) TO authenticated;

-- Admin gerencia links; guardian vê os próprios; aluno vê links do seu id
CREATE POLICY guardian_links_select ON public.guardian_links
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR guardian_id = auth.uid()
    OR student_id = auth.uid()
    OR (
      status = 'pending'
      AND lower(invited_email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  );

CREATE POLICY guardian_links_insert_admin ON public.guardian_links
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY guardian_links_update_admin ON public.guardian_links
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY guardian_links_delete_admin ON public.guardian_links
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- Convite admin
CREATE OR REPLACE FUNCTION public.invite_guardian_for_student(
  p_student_id uuid,
  p_email text,
  p_relationship text DEFAULT 'Responsável'
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
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem convidar responsáveis';
  END IF;

  IF v_email IS NULL OR length(v_email) < 5 THEN
    RAISE EXCEPTION 'Informe um e-mail válido';
  END IF;

  SELECT role INTO v_existing_role
  FROM public.profiles
  WHERE lower(email) = v_email
  LIMIT 1;

  IF v_existing_role IS NOT NULL AND v_existing_role <> 'guardian' THEN
    RAISE EXCEPTION 'Este e-mail já pertence a um usuário que não é responsável';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = p_student_id AND p.role = 'member'
  ) THEN
    RAISE EXCEPTION 'Aluno não encontrado';
  END IF;

  INSERT INTO public.guardian_links (
    student_id, invited_email, relationship, status, created_by, guardian_id
  )
  VALUES (
    p_student_id,
    v_email,
    COALESCE(NULLIF(btrim(p_relationship), ''), 'Responsável'),
    'pending',
    auth.uid(),
    CASE WHEN v_existing_role = 'guardian' THEN (
      SELECT id FROM public.profiles WHERE lower(email) = v_email LIMIT 1
    ) ELSE NULL END
  )
  RETURNING id INTO v_id;

  -- Se já existe conta guardian, ativa imediatamente
  IF v_existing_role = 'guardian' THEN
    UPDATE public.guardian_links
    SET status = 'active',
        activated_at = now(),
        guardian_id = (SELECT id FROM public.profiles WHERE lower(email) = v_email LIMIT 1)
    WHERE id = v_id;
  END IF;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.invite_guardian_for_student(uuid, text, text) TO authenticated;

-- Ativa convites pendentes para o usuário logado
CREATE OR REPLACE FUNCTION public.activate_guardian_invites()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_email text;
  v_role text;
  v_count integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT lower(email), role INTO v_email, v_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_email IS NULL OR v_email = '' THEN
    SELECT lower(email) INTO v_email FROM auth.users WHERE id = auth.uid();
  END IF;

  IF v_role IS NOT NULL AND v_role NOT IN ('guardian', 'member') THEN
    RETURN 0;
  END IF;

  -- Não converter aluno/professor/admin estabelecidos (já aprovados como member com dados)
  IF v_role = 'member' AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND approval_status = 'approved'
      AND COALESCE(instrument, '') <> ''
      AND birth_date IS NOT NULL
  ) AND NOT EXISTS (
    SELECT 1 FROM public.guardian_links
    WHERE status = 'pending' AND lower(invited_email) = v_email AND guardian_id IS NULL
  ) THEN
    RETURN 0;
  END IF;

  -- Se há convite pendente, promove a guardian aprovado
  IF EXISTS (
    SELECT 1 FROM public.guardian_links
    WHERE status = 'pending'
      AND lower(invited_email) = v_email
  ) THEN
    UPDATE public.profiles
    SET role = 'guardian',
        approval_status = 'approved',
        approved_at = COALESCE(approved_at, now()),
        email = COALESCE(NULLIF(email, ''), v_email)
    WHERE id = auth.uid();

    UPDATE public.guardian_links
    SET guardian_id = auth.uid(),
        status = 'active',
        activated_at = now()
    WHERE status = 'pending'
      AND lower(invited_email) = v_email
      AND (guardian_id IS NULL OR guardian_id = auth.uid());

    GET DIAGNOSTICS v_count = ROW_COUNT;
  END IF;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.activate_guardian_invites() TO authenticated;

-- Cadastro: se metadata signup_as=guardian ou há convite, cria como guardian aprovado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_as_guardian boolean := false;
  v_email text := lower(COALESCE(NEW.email, ''));
BEGIN
  v_as_guardian :=
    COALESCE(NEW.raw_user_meta_data->>'signup_as', '') = 'guardian'
    OR EXISTS (
      SELECT 1 FROM public.guardian_links
      WHERE status = 'pending'
        AND lower(invited_email) = v_email
    );

  IF v_as_guardian THEN
    INSERT INTO public.profiles (
      id, full_name, instrument, registration_number, avatar_url,
      birth_date, valid_until, city, state, cpf, rg, disability_info,
      guardian_name, guardian_phone,
      role, email, approval_status, approved_at
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
      'approved',
      now()
    );

    UPDATE public.guardian_links
    SET guardian_id = NEW.id,
        status = 'active',
        activated_at = now()
    WHERE status = 'pending'
      AND lower(invited_email) = v_email;
  ELSE
    INSERT INTO public.profiles (
      id, full_name, instrument, registration_number, avatar_url,
      birth_date, valid_until, city, state, cpf, rg, disability_info,
      guardian_name, guardian_phone,
      role, email, approval_status
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
      NULLIF(btrim(COALESCE(NEW.raw_user_meta_data->>'guardian_name', '')), ''),
      NULLIF(btrim(COALESCE(NEW.raw_user_meta_data->>'guardian_phone', '')), ''),
      'member',
      COALESCE(NEW.email, ''),
      'pending'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Travel: aluno só lê; guardian vinculado assina; admin total
DROP POLICY IF EXISTS travel_auth_select ON public.travel_authorizations;
DROP POLICY IF EXISTS travel_auth_update ON public.travel_authorizations;

CREATE POLICY travel_auth_select ON public.travel_authorizations
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR member_id = auth.uid()
    OR public.is_active_guardian_of(member_id)
  );

CREATE POLICY travel_auth_update ON public.travel_authorizations
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR (
      public.is_active_guardian_of(member_id)
      AND status = 'pending'
    )
  )
  WITH CHECK (
    public.is_admin()
    OR (
      public.is_active_guardian_of(member_id)
      AND status IN ('pending', 'signed')
    )
  );
