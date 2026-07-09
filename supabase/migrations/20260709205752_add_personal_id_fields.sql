ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rg TEXT NOT NULL DEFAULT '';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, instrument, registration_number, avatar_url, birth_date, valid_until, city, state, cpf, rg)
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
    COALESCE(NEW.raw_user_meta_data->>'rg', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

UPDATE public.profiles
SET
  city = COALESCE(NULLIF(city, ''), 'Botucatu'),
  state = COALESCE(NULLIF(state, ''), 'SP'),
  cpf = COALESCE(NULLIF(cpf, ''), '123.456.789-00'),
  rg = COALESCE(NULLIF(rg, ''), '12.345.678-9')
WHERE id IN (SELECT id FROM auth.users WHERE email = 'allantomazela@gmail.com');
