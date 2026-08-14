-- Matrícula sequencial automática + verificação pública da carteirinha

CREATE SEQUENCE IF NOT EXISTS public.registration_number_seq AS bigint INCREMENT BY 1 MINVALUE 1;

CREATE OR REPLACE FUNCTION public.next_registration_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  n bigint;
BEGIN
  n := nextval('public.registration_number_seq');
  RETURN 'BMB-' || to_char(n, 'FM0000');
END;
$$;

DO $$
DECLARE
  max_n bigint;
  r record;
BEGIN
  SELECT COALESCE(MAX((regexp_match(registration_number, '([0-9]+)$'))[1]::bigint), 0)
  INTO max_n
  FROM public.profiles
  WHERE registration_number ~ '[0-9]+$';

  IF max_n < 1 THEN
    PERFORM setval('public.registration_number_seq', 1, false);
  ELSE
    PERFORM setval('public.registration_number_seq', max_n, true);
  END IF;

  FOR r IN
    SELECT id
    FROM public.profiles
    WHERE registration_number IS NULL OR btrim(registration_number) = ''
    ORDER BY updated_at NULLS LAST, id
  LOOP
    UPDATE public.profiles
    SET registration_number = public.next_registration_number()
    WHERE id = r.id;
  END LOOP;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_registration_number_unique
  ON public.profiles (registration_number)
  WHERE registration_number IS NOT NULL AND btrim(registration_number) <> '';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, full_name, instrument, registration_number, avatar_url,
    birth_date, valid_until, city, state, cpf, rg, disability_info,
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
    'member',
    COALESCE(NEW.email, ''),
    'pending'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_profile_approval_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
     OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
     OR NEW.role IS DISTINCT FROM OLD.role
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.registration_number IS DISTINCT FROM OLD.registration_number
     OR NEW.valid_until IS DISTINCT FROM OLD.valid_until THEN
    RAISE EXCEPTION 'Não é permitido alterar matrícula, validade, status ou função';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_id_card(member_id uuid)
RETURNS TABLE (
  full_name text,
  registration_number text,
  instrument text,
  valid_until date,
  city text,
  state text,
  role text,
  is_valid boolean
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
    ) AS is_valid
  FROM public.profiles p
  WHERE p.id = member_id
    AND p.approval_status = 'approved';
$$;

GRANT EXECUTE ON FUNCTION public.verify_id_card(uuid) TO anon, authenticated;
GRANT USAGE ON SEQUENCE public.registration_number_seq TO postgres, service_role;
