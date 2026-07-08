-- Ensure RLS is enabled
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Ensure RLS policies for materials (authenticated SELECT)
DROP POLICY IF EXISTS "materials_auth_select" ON public.materials;
CREATE POLICY "materials_auth_select" ON public.materials
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "materials_select_authenticated" ON public.materials;
CREATE POLICY "materials_select_authenticated" ON public.materials
  FOR SELECT TO authenticated USING (true);

-- Ensure RLS policies for videos (authenticated SELECT)
DROP POLICY IF EXISTS "videos_auth_select" ON public.videos;
CREATE POLICY "videos_auth_select" ON public.videos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "videos_select_authenticated" ON public.videos;
CREATE POLICY "videos_select_authenticated" ON public.videos
  FOR SELECT TO authenticated USING (true);

-- Update existing materials to use method categories
UPDATE public.materials SET category = 'Método I' WHERE id = 'b0000001-0000-0000-0000-000000000001';
UPDATE public.materials SET category = 'Método II' WHERE id = 'b0000002-0000-0000-0000-000000000001';
UPDATE public.materials SET category = 'Método I' WHERE id = 'b0000003-0000-0000-0000-000000000001';
UPDATE public.materials SET category = 'Método II' WHERE id = 'b0000004-0000-0000-0000-000000000001';

-- Update existing videos to use method categories
UPDATE public.videos SET category = 'Método I' WHERE id = 'c0000001-0000-0000-0000-000000000001';
UPDATE public.videos SET category = 'Método II' WHERE id = 'c0000002-0000-0000-0000-000000000001';
UPDATE public.videos SET category = 'Método I' WHERE id = 'c0000003-0000-0000-0000-000000000001';

-- Add additional seed materials for each method
INSERT INTO public.materials (id, title, file_path, category) VALUES
  ('b0000005-0000-0000-0000-000000000001', 'Exercícios de Respiração e Postura', 'methods/exercicios-respiracao.pdf', 'Método I'),
  ('b0000006-0000-0000-0000-000000000001', 'Partitura - Marcha Imperial', 'scores/marcha-imperial.pdf', 'Método II'),
  ('b0000007-0000-0000-0000-000000000001', 'Técnica de Embocadura para Metais', 'methods/embocadura-metais.pdf', 'Método I'),
  ('b0000008-0000-0000-0000-000000000001', 'Partitura - Abertura 2026', 'scores/abertura-2026.pdf', 'Método II')
ON CONFLICT (id) DO NOTHING;

-- Add additional seed videos for each method
INSERT INTO public.videos (id, title, video_url, description, category) VALUES
  ('c0000004-0000-0000-0000-000000000001', 'Leitura Rítmica Básica', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Exercícios de leitura musical para iniciantes.', 'Método I'),
  ('c0000005-0000-0000-0000-000000000001', 'Técnica Avançada de Improvisação', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Para músicos com mais experiência.', 'Método II'),
  ('c0000006-0000-0000-0000-000000000001', 'Postura Corporal na Marcha', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Fundamentos de postura e movimento.', 'Método I')
ON CONFLICT (id) DO NOTHING;
