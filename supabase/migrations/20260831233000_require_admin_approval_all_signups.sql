-- Todo cadastro (aluno e responsável) fica pendente até aprovação do administrador.

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
      role, email, approval_status
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
      'pending'
    );

    -- Associa o convite, mas só ativa após aprovação do admin
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

-- Ativa vínculo/role de responsável sem auto-aprovar o acesso
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

  -- Não converter aluno já estabelecido (aprovado com dados de membro)
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

  IF EXISTS (
    SELECT 1 FROM public.guardian_links
    WHERE status = 'pending'
      AND lower(invited_email) = v_email
  ) THEN
    UPDATE public.profiles
    SET role = 'guardian',
        email = COALESCE(NULLIF(email, ''), v_email)
    WHERE id = auth.uid();

    UPDATE public.guardian_links
    SET guardian_id = auth.uid()
    WHERE status = 'pending'
      AND lower(invited_email) = v_email
      AND (guardian_id IS NULL OR guardian_id = auth.uid());

    GET DIAGNOSTICS v_count = ROW_COUNT;
  END IF;

  RETURN v_count;
END;
$$;

-- Ao aprovar perfil, libera vínculos de responsável pendentes
CREATE OR REPLACE FUNCTION public.activate_guardian_links_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.approval_status = 'approved'
     AND (OLD.approval_status IS DISTINCT FROM 'approved')
     AND NEW.role = 'guardian' THEN
    UPDATE public.guardian_links
    SET status = 'active',
        activated_at = COALESCE(activated_at, now()),
        guardian_id = COALESCE(guardian_id, NEW.id)
    WHERE status = 'pending'
      AND (
        guardian_id = NEW.id
        OR lower(invited_email) = lower(COALESCE(NEW.email, ''))
      );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_activate_guardian_links_on_approval ON public.profiles;
CREATE TRIGGER trg_activate_guardian_links_on_approval
  AFTER UPDATE OF approval_status ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.activate_guardian_links_on_approval();
