-- Approval gate for student registration + email on profiles for admin review

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id);

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_approval_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_approval_status_check
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

COMMENT ON COLUMN public.profiles.approval_status IS
  'pending = aguardando admin; approved = pode logar; rejected = cadastro negado';

-- Existing accounts remain usable after enabling the approval gate
UPDATE public.profiles
SET
  approval_status = 'approved',
  approved_at = COALESCE(approved_at, now())
WHERE approval_status = 'pending'
  AND approved_at IS NULL
  AND id IN (SELECT id FROM auth.users);

-- Backfill email from auth.users when empty
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND (p.email IS NULL OR p.email = '')
  AND u.email IS NOT NULL;

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
    COALESCE(NEW.raw_user_meta_data->>'registration_number', ''),
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

-- Prevent non-admins from changing approval fields on their own profile
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
     OR NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'Não é permitido alterar status de aprovação ou função';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_approval_fields ON public.profiles;
CREATE TRIGGER protect_profile_approval_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_approval_fields();

CREATE INDEX IF NOT EXISTS profiles_approval_status_idx
  ON public.profiles (approval_status);
