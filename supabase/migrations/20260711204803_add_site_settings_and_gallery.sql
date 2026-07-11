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

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

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

INSERT INTO public.site_settings (key, value) VALUES
  ('header_title', 'Banda BMB'),
  ('header_subtitle', 'A Tradição Musical de Botucatu'),
  ('hero_title', 'A Tradição Musical de Botucatu'),
  ('hero_subtitle', 'Mais que uma banda marcial, uma familia unida pela paixao a musica, disciplina e arte.'),
  ('hero_image_url', ''),
  ('contact_email', 'contato@bandabmb.com.br'),
  ('about_text', 'Decadas de dedicacao a cultura e educacao musical na nossa regiao.'),
  ('join_cta_title', 'Quer fazer parte da banda?'),
  ('join_cta_text', 'Nao e necessario ter experiencia previa. Nos oferecemos aulas praticas e teoricas para que voce aprenda do zero. Venha construir essa historia com a gente.'),
  ('tile_history_title', 'Nossa Historia'),
  ('tile_history_text', 'Decadas de dedicacao a cultura e educacao musical na nossa regiao.'),
  ('tile_agenda_title', 'Agenda de Eventos'),
  ('tile_agenda_text', 'Confira onde sera nossa proxima apresentacao e junte-se a nos.'),
  ('tile_values_title', 'Nossos Valores'),
  ('tile_values_text', 'Disciplina, respeito, trabalho em equipe e excelencia musical.'),
  ('footer_about', 'A tradicao musical de Botucatu-SP, transformando vidas atraves da musica e da disciplina.')
ON CONFLICT (key) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

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
