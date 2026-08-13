-- Bootstrap completo do schema Banda BMB para projeto novo
-- Projeto: hcgqshndvnxamjpujgzs

-- ========== TABLES ==========
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  instrument TEXT NOT NULL DEFAULT '',
  registration_number TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  birth_date DATE,
  valid_until DATE,
  city TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  cpf TEXT NOT NULL DEFAULT '',
  rg TEXT NOT NULL DEFAULT '',
  disability_info TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  file_path TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Geral',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gallery_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Galeria',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  instrument TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

-- ========== FUNCTIONS ==========
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, full_name, instrument, registration_number, avatar_url,
    birth_date, valid_until, city, state, cpf, rg, disability_info, role
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
    'member'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_profile_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_timestamp();

-- ========== RLS POLICIES ==========
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "events_select_public" ON public.events;
CREATE POLICY "events_select_public" ON public.events
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "events_insert_admin" ON public.events;
CREATE POLICY "events_insert_admin" ON public.events
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "events_update_admin" ON public.events;
CREATE POLICY "events_update_admin" ON public.events
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "events_delete_admin" ON public.events;
CREATE POLICY "events_delete_admin" ON public.events
  FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "materials_select_authenticated" ON public.materials;
CREATE POLICY "materials_select_authenticated" ON public.materials
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "materials_insert_admin" ON public.materials;
CREATE POLICY "materials_insert_admin" ON public.materials
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "materials_update_admin" ON public.materials;
CREATE POLICY "materials_update_admin" ON public.materials
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "materials_delete_admin" ON public.materials;
CREATE POLICY "materials_delete_admin" ON public.materials
  FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "videos_select_authenticated" ON public.videos;
CREATE POLICY "videos_select_authenticated" ON public.videos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "videos_insert_admin" ON public.videos;
CREATE POLICY "videos_insert_admin" ON public.videos
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "videos_update_admin" ON public.videos;
CREATE POLICY "videos_update_admin" ON public.videos
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "videos_delete_admin" ON public.videos;
CREATE POLICY "videos_delete_admin" ON public.videos
  FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "site_settings_select_public" ON public.site_settings;
CREATE POLICY "site_settings_select_public" ON public.site_settings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "site_settings_insert_admin" ON public.site_settings;
CREATE POLICY "site_settings_insert_admin" ON public.site_settings
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "site_settings_update_admin" ON public.site_settings;
CREATE POLICY "site_settings_update_admin" ON public.site_settings
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "site_settings_delete_admin" ON public.site_settings;
CREATE POLICY "site_settings_delete_admin" ON public.site_settings
  FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "gallery_photos_select_public" ON public.gallery_photos;
CREATE POLICY "gallery_photos_select_public" ON public.gallery_photos
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "gallery_photos_insert_admin" ON public.gallery_photos;
CREATE POLICY "gallery_photos_insert_admin" ON public.gallery_photos
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "gallery_photos_update_admin" ON public.gallery_photos;
CREATE POLICY "gallery_photos_update_admin" ON public.gallery_photos
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "gallery_photos_delete_admin" ON public.gallery_photos;
CREATE POLICY "gallery_photos_delete_admin" ON public.gallery_photos
  FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "contact_inquiries_insert_public" ON public.contact_inquiries;
CREATE POLICY "contact_inquiries_insert_public" ON public.contact_inquiries
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "contact_inquiries_select_admin" ON public.contact_inquiries;
CREATE POLICY "contact_inquiries_select_admin" ON public.contact_inquiries
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "contact_inquiries_update_admin" ON public.contact_inquiries;
CREATE POLICY "contact_inquiries_update_admin" ON public.contact_inquiries
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "contact_inquiries_delete_admin" ON public.contact_inquiries;
CREATE POLICY "contact_inquiries_delete_admin" ON public.contact_inquiries
  FOR DELETE TO authenticated USING (public.is_admin());

-- ========== STORAGE ==========
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('band-materials', 'band-materials', false),
  ('avatars', 'avatars', true),
  ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "band_materials_read_authenticated" ON storage.objects;
CREATE POLICY "band_materials_read_authenticated" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'band-materials');

DROP POLICY IF EXISTS "band_materials_upload_authenticated" ON storage.objects;
CREATE POLICY "band_materials_upload_authenticated" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'band-materials');

DROP POLICY IF EXISTS "band_materials_update_authenticated" ON storage.objects;
CREATE POLICY "band_materials_update_authenticated" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'band-materials');

DROP POLICY IF EXISTS "band_materials_delete_authenticated" ON storage.objects;
CREATE POLICY "band_materials_delete_authenticated" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'band-materials');

DROP POLICY IF EXISTS "avatars_read" ON storage.objects;
CREATE POLICY "avatars_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_upload" ON storage.objects;
CREATE POLICY "avatars_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND name LIKE auth.uid()::text || '/%');

DROP POLICY IF EXISTS "avatars_update" ON storage.objects;
CREATE POLICY "avatars_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND name LIKE auth.uid()::text || '/%')
  WITH CHECK (bucket_id = 'avatars' AND name LIKE auth.uid()::text || '/%');

DROP POLICY IF EXISTS "avatars_delete" ON storage.objects;
CREATE POLICY "avatars_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND name LIKE auth.uid()::text || '/%');

DROP POLICY IF EXISTS "gallery_storage_read" ON storage.objects;
CREATE POLICY "gallery_storage_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'gallery');

DROP POLICY IF EXISTS "gallery_storage_upload" ON storage.objects;
CREATE POLICY "gallery_storage_upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'gallery');

DROP POLICY IF EXISTS "gallery_storage_update" ON storage.objects;
CREATE POLICY "gallery_storage_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'gallery');

DROP POLICY IF EXISTS "gallery_storage_delete" ON storage.objects;
CREATE POLICY "gallery_storage_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'gallery');

-- ========== SEEDS ==========
INSERT INTO public.site_settings (key, value) VALUES
  ('header_title', 'Banda BMB'),
  ('header_subtitle', 'A Tradição Musical de Botucatu'),
  ('header_logo_url', ''),
  ('hero_title', 'A Tradição Musical de Botucatu'),
  ('hero_subtitle', 'Mais que uma banda marcial, uma família unida pela paixão à música, disciplina e arte.'),
  ('hero_image_url', ''),
  ('contact_email', 'contato@bandabmb.com.br'),
  ('contact_phone', '(14) 99999-9999'),
  ('about_text', 'Décadas de dedicação à cultura e educação musical na nossa região.'),
  ('join_cta_title', 'Quer fazer parte da banda?'),
  ('join_cta_text', 'Não é necessário ter experiência prévia. Nós oferecemos aulas práticas e teóricas para que você aprenda do zero. Venha construir essa história com a gente.'),
  ('tile_history_title', 'Nossa História'),
  ('tile_history_text', 'Décadas de dedicação à cultura e educação musical na nossa região.'),
  ('tile_agenda_title', 'Agenda de Eventos'),
  ('tile_agenda_text', 'Confira onde será nossa próxima apresentação e junte-se a nós.'),
  ('tile_values_title', 'Nossos Valores'),
  ('tile_values_text', 'Disciplina, respeito, trabalho em equipe e excelência musical.'),
  ('footer_about', 'A tradição musical de Botucatu-SP, transformando vidas através da música e da disciplina.'),
  ('footer_address', 'Rua da Música, 123 - Centro'),
  ('footer_city', 'Botucatu - SP, 18600-000')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.events (id, title, description, event_date, location) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Desfile de Aniversário da Cidade', 'Apresentação cívica na avenida principal com todo o corpo musical.', '2026-08-14T09:00:00Z', 'Av. Dom Lúcio, Botucatu-SP'),
  ('a0000002-0000-0000-0000-000000000001', 'Ensaio Geral Aberto', 'Ensaio de preparação para o campeonato estadual.', '2026-08-20T19:30:00Z', 'Sede da Banda BMB'),
  ('a0000003-0000-0000-0000-000000000001', 'Campeonato Estadual de Bandas', 'Competição oficial da federação.', '2026-09-05T14:00:00Z', 'Ginásio do Ibirapuera, São Paulo-SP')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.materials (id, title, file_path, category) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'Hino de Botucatu (Grade)', 'scores/hino-botucatu.pdf', 'Método I'),
  ('b0000002-0000-0000-0000-000000000001', 'Método Essencial - Trompete Vol. 1', 'methods/metodo-trompete-vol1.pdf', 'Método II'),
  ('b0000003-0000-0000-0000-000000000001', 'Regulamento Interno 2026', 'docs/regulamento-2026.pdf', 'Método I'),
  ('b0000004-0000-0000-0000-000000000001', 'Marcha Radetzky (Trompete 1)', 'scores/radetzky-trompete1.pdf', 'Método II'),
  ('b0000005-0000-0000-0000-000000000001', 'Exercícios de Respiração e Postura', 'methods/exercicios-respiracao.pdf', 'Método I'),
  ('b0000006-0000-0000-0000-000000000001', 'Partitura - Marcha Imperial', 'scores/marcha-imperial.pdf', 'Método II')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.videos (id, title, video_url, description, category) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'Postura Básica de Marcha', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Instruções iniciais para novos membros.', 'Método I'),
  ('c0000002-0000-0000-0000-000000000001', 'Coreografia - Peça de Confronto', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Revisão dos movimentos do compasso 40 ao 80.', 'Método II'),
  ('c0000003-0000-0000-0000-000000000001', 'Aquecimento Diário de Metais', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Rotina de 15 minutos.', 'Método I'),
  ('c0000004-0000-0000-0000-000000000001', 'Leitura Rítmica Básica', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Exercícios de leitura musical para iniciantes.', 'Método I'),
  ('c0000005-0000-0000-0000-000000000001', 'Técnica Avançada de Improvisação', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Para músicos com mais experiência.', 'Método II')
ON CONFLICT (id) DO NOTHING;
