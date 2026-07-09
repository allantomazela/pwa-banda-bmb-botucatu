ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id OR public.is_admin()) WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "events_public_select" ON public.events;
DROP POLICY IF EXISTS "events_select_public" ON public.events;
CREATE POLICY "events_select_public" ON public.events
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "events_auth_insert" ON public.events;
DROP POLICY IF EXISTS "events_insert_authenticated" ON public.events;
CREATE POLICY "events_insert_admin" ON public.events
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "events_auth_update" ON public.events;
DROP POLICY IF EXISTS "events_update_authenticated" ON public.events;
CREATE POLICY "events_update_admin" ON public.events
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "events_auth_delete" ON public.events;
DROP POLICY IF EXISTS "events_delete_authenticated" ON public.events;
CREATE POLICY "events_delete_admin" ON public.events
  FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "materials_auth_select" ON public.materials;
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

DROP POLICY IF EXISTS "videos_auth_select" ON public.videos;
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

UPDATE public.profiles
SET role = 'admin'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'allantomazela@gmail.com');

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars_read" ON storage.objects;
CREATE POLICY "avatars_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_upload" ON storage.objects;
CREATE POLICY "avatars_upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_update" ON storage.objects;
CREATE POLICY "avatars_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "band_materials_read" ON storage.objects;
DROP POLICY IF EXISTS "band_materials_read_authenticated" ON storage.objects;
CREATE POLICY "band_materials_read_authenticated" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'band-materials');

DROP POLICY IF EXISTS "band_materials_upload" ON storage.objects;
DROP POLICY IF EXISTS "band_materials_write_authenticated" ON storage.objects;
CREATE POLICY "band_materials_upload_authenticated" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'band-materials');

DROP POLICY IF EXISTS "band_materials_update_authenticated" ON storage.objects;
CREATE POLICY "band_materials_update_authenticated" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'band-materials');

DROP POLICY IF EXISTS "band_materials_delete_authenticated" ON storage.objects;
CREATE POLICY "band_materials_delete_authenticated" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'band-materials');
