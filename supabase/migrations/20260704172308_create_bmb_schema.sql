-- Create tables
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  instrument TEXT NOT NULL DEFAULT '',
  registration_number TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Geral',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Profiles: users can SELECT/UPDATE/INSERT only their own row
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Events: public SELECT, authenticated for modifications
DROP POLICY IF EXISTS "events_select_public" ON public.events;
CREATE POLICY "events_select_public" ON public.events
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "events_insert_authenticated" ON public.events;
CREATE POLICY "events_insert_authenticated" ON public.events
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "events_update_authenticated" ON public.events;
CREATE POLICY "events_update_authenticated" ON public.events
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "events_delete_authenticated" ON public.events;
CREATE POLICY "events_delete_authenticated" ON public.events
  FOR DELETE TO authenticated USING (true);

-- Materials: authenticated SELECT only
DROP POLICY IF EXISTS "materials_select_authenticated" ON public.materials;
CREATE POLICY "materials_select_authenticated" ON public.materials
  FOR SELECT TO authenticated USING (true);

-- Videos: authenticated SELECT only
DROP POLICY IF EXISTS "videos_select_authenticated" ON public.videos;
CREATE POLICY "videos_select_authenticated" ON public.videos
  FOR SELECT TO authenticated USING (true);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update updated_at on profiles
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('band-materials', 'band-materials', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "band_materials_read_authenticated" ON storage.objects;
CREATE POLICY "band_materials_read_authenticated" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'band-materials');

DROP POLICY IF EXISTS "band_materials_write_authenticated" ON storage.objects;
CREATE POLICY "band_materials_write_authenticated" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'band-materials');

-- Seed user
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
      '{"full_name": "Allan Tomazela"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
    INSERT INTO public.profiles (id, full_name, instrument, registration_number, avatar_url)
    VALUES (new_user_id, 'Allan Tomazela', 'Trompete', 'BMB-2024-001', 'https://img.usecurling.com/ppl/medium?gender=male&seed=1')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Seed events
INSERT INTO public.events (id, title, description, event_date, location) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Desfile de Aniversário da Cidade', 'Apresentação cívica na avenida principal com todo o corpo musical.', '2026-08-14T09:00:00Z', 'Av. Dom Lúcio, Botucatu-SP'),
  ('a1000000-0000-0000-0000-000000000002', 'Ensaio Geral Aberto', 'Ensaio de preparação para o campeonato estadual.', '2026-08-20T19:30:00Z', 'Sede da Banda BMB'),
  ('a1000000-0000-0000-0000-000000000003', 'Campeonato Estadual de Bandas', 'Competição oficial da federação.', '2026-09-05T14:00:00Z', 'Ginásio do Ibirapuera, São Paulo-SP')
ON CONFLICT (id) DO NOTHING;

-- Seed materials
INSERT INTO public.materials (id, title, file_path, category) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Hino de Botucatu (Grade)', 'partituras/hino-botucatu.pdf', 'Partituras'),
  ('b1000000-0000-0000-0000-000000000002', 'Método Essencial - Trompete Vol. 1', 'metodos/trompete-vol1.pdf', 'Métodos'),
  ('b1000000-0000-0000-0000-000000000003', 'Regulamento Interno 2026', 'avisos/regulamento-2026.pdf', 'Avisos'),
  ('b1000000-0000-0000-0000-000000000004', 'Marcha Radetzky (Trompete 1)', 'partituras/radetzky-trompete1.pdf', 'Partituras')
ON CONFLICT (id) DO NOTHING;

-- Seed videos
INSERT INTO public.videos (id, title, video_url, description) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Postura Básica de Marcha', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Instruções iniciais para novos membros.'),
  ('c1000000-0000-0000-0000-000000000002', 'Coreografia - Peça de Confronto', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Revisão dos movimentos do compasso 40 ao 80.'),
  ('c1000000-0000-0000-0000-000000000003', 'Aquecimento Diário de Metais', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Rotina de 15 minutos.')
ON CONFLICT (id) DO NOTHING;
