-- Contato do responsável para alunos menores de idade

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS guardian_name text,
  ADD COLUMN IF NOT EXISTS guardian_phone text;

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
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.verify_id_card(uuid);

CREATE FUNCTION public.verify_id_card(member_id uuid)
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
  guardian_phone text
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
    p.guardian_phone
  FROM public.profiles p
  WHERE p.id = member_id
    AND p.approval_status = 'approved';
$$;

GRANT EXECUTE ON FUNCTION public.verify_id_card(uuid) TO anon, authenticated;
