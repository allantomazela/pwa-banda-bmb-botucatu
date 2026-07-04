CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  instrument TEXT NOT NULL DEFAULT '',
  registration_number TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  file_path TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT '';
ALTER TABLE public.videos ALTER COLUMN description SET NOT NULL;
ALTER TABLE public.videos ALTER COLUMN description SET DEFAULT '';

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "events_public_select" ON public.events;
CREATE POLICY "events_public_select" ON public.events
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "events_auth_insert" ON public.events;
CREATE POLICY "events_auth_insert" ON public.events
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "events_auth_update" ON public.events;
CREATE POLICY "events_auth_update" ON public.events
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "events_auth_delete" ON public.events;
CREATE POLICY "events_auth_delete" ON public.events
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "materials_auth_select" ON public.materials;
CREATE POLICY "materials_auth_select" ON public.materials
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "videos_auth_select" ON public.videos;
CREATE POLICY "videos_auth_select" ON public.videos
  FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, instrument, registration_number, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'instrument', ''),
    COALESCE(NEW.raw_user_meta_data->>'registration_number', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_profile_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_timestamp();

INSERT INTO storage.buckets (id, name, public)
VALUES ('band-materials', 'band-materials', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "band_materials_read" ON storage.objects;
CREATE POLICY "band_materials_read" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'band-materials');

DROP POLICY IF EXISTS "band_materials_upload" ON storage.objects;
CREATE POLICY "band_materials_upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'band-materials');

DO $$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'allantomazela@gmail.com') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'allantomazela@gmail.com',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Allan Tomazela", "instrument": "Trompete", "registration_number": "BMB-2024-001", "avatar_url": "https://img.usecurling.com/ppl/medium?gender=male&seed=1"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
  END IF;
END $$;

INSERT INTO public.events (id, title, description, event_date, location) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Desfile de Aniversário da Cidade', 'Apresentação civica na avenida principal com todo o corpo musical.', '2026-08-14T09:00:00Z', 'Av. Dom Lucio, Botucatu-SP'),
  ('a0000002-0000-0000-0000-000000000001', 'Ensaio Geral Aberto', 'Ensaio de preparacao para o campeonato estadual.', '2026-08-20T19:30:00Z', 'Sede da Banda BMB'),
  ('a0000003-0000-0000-0000-000000000001', 'Campeonato Estadual de Bandas', 'Competicao oficial da federacao.', '2026-09-05T14:00:00Z', 'Ginasio do Ibirapuera, Sao Paulo-SP')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.materials (id, title, file_path, category) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'Hino de Botucatu (Grade)', 'scores/hino-botucatu.pdf', 'Partituras'),
  ('b0000002-0000-0000-0000-000000000001', 'Metodo Essencial - Trompete Vol. 1', 'methods/metodo-trompete-vol1.pdf', 'Metodos'),
  ('b0000003-0000-0000-0000-000000000001', 'Regulamento Interno 2026', 'docs/regulamento-2026.pdf', 'Avisos'),
  ('b0000004-0000-0000-0000-000000000001', 'Marcha Radetzky (Trompete 1)', 'scores/radetzky-trompete1.pdf', 'Partituras')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.videos (id, title, video_url, description, category) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'Postura Basica de Marcha', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Instrucoes iniciais para novos membros.', 'Marcha'),
  ('c0000002-0000-0000-0000-000000000001', 'Coreografia - Peca de Confronto', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Revisao dos movimentos do compasso 40 ao 80.', 'Coreografia'),
  ('c0000003-0000-0000-0000-000000000001', 'Aquecimento Diario de Metais', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Rotina de 15 minutos.', 'Instrumento')
ON CONFLICT (id) DO NOTHING;
