ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS valid_until DATE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, instrument, registration_number, avatar_url, birth_date, valid_until)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'instrument', ''),
    COALESCE(NEW.raw_user_meta_data->>'registration_number', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE((NEW.raw_user_meta_data->>'birth_date')::DATE, NULL),
    COALESCE((NEW.raw_user_meta_data->>'valid_until')::DATE, NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

UPDATE public.profiles
SET
  birth_date = COALESCE(birth_date, '1995-03-15'::DATE),
  valid_until = COALESCE(valid_until, '2026-12-31'::DATE)
WHERE id IN (SELECT id FROM auth.users WHERE email = 'allantomazela@gmail.com');

UPDATE public.profiles
SET
  birth_date = '1995-03-15'::DATE,
  valid_until = '2026-12-31'::DATE
WHERE birth_date IS NULL AND valid_until IS NULL;
