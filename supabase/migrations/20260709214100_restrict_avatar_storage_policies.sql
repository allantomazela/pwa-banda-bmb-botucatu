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
