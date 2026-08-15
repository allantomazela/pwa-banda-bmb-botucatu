-- Vídeos públicos na galeria de mídia; exclusivos permanecem no portal

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "videos_auth_select" ON public.videos;
DROP POLICY IF EXISTS "videos_select_authenticated" ON public.videos;
DROP POLICY IF EXISTS "videos_select_public" ON public.videos;

CREATE POLICY "videos_select_public"
  ON public.videos
  FOR SELECT
  TO anon
  USING (is_public = true);

CREATE POLICY "videos_select_authenticated"
  ON public.videos
  FOR SELECT
  TO authenticated
  USING (true);
