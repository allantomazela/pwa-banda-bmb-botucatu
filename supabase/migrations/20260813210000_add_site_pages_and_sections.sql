-- Páginas e seções editáveis do site público (CMS admin-only write)

CREATE TABLE IF NOT EXISTS public.site_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  nav_label text NOT NULL,
  show_in_nav boolean NOT NULL DEFAULT false,
  is_system boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.site_pages(id) ON DELETE CASCADE,
  section_type text NOT NULL CHECK (section_type IN ('text', 'image', 'video', 'gallery', 'cta')),
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  media_url text NOT NULL DEFAULT '',
  link_url text NOT NULL DEFAULT '',
  link_label text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_sections_page_sort_idx
  ON public.site_sections (page_id, sort_order);

ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_pages_select_public ON public.site_pages;
CREATE POLICY site_pages_select_public ON public.site_pages
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS site_pages_insert_admin ON public.site_pages;
CREATE POLICY site_pages_insert_admin ON public.site_pages
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS site_pages_update_admin ON public.site_pages;
CREATE POLICY site_pages_update_admin ON public.site_pages
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS site_pages_delete_admin ON public.site_pages;
CREATE POLICY site_pages_delete_admin ON public.site_pages
  FOR DELETE TO authenticated USING (public.is_admin() AND is_system = false);

DROP POLICY IF EXISTS site_sections_select_public ON public.site_sections;
CREATE POLICY site_sections_select_public ON public.site_sections
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS site_sections_insert_admin ON public.site_sections;
CREATE POLICY site_sections_insert_admin ON public.site_sections
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS site_sections_update_admin ON public.site_sections;
CREATE POLICY site_sections_update_admin ON public.site_sections
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS site_sections_delete_admin ON public.site_sections;
CREATE POLICY site_sections_delete_admin ON public.site_sections
  FOR DELETE TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.protect_system_pages()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.is_system THEN
    NEW.slug := OLD.slug;
    NEW.is_system := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_system_pages_trg ON public.site_pages;
CREATE TRIGGER protect_system_pages_trg
  BEFORE UPDATE ON public.site_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_system_pages();

INSERT INTO public.site_pages (slug, title, nav_label, show_in_nav, is_system, sort_order)
VALUES
  ('home', 'Início', 'Início', false, true, 0),
  ('sobre', 'Sobre', 'Sobre', false, true, 1),
  ('agenda', 'Agenda', 'Agenda', false, true, 2),
  ('media', 'Mídia', 'Mídia', false, true, 3),
  ('contato', 'Contato', 'Contato', false, true, 4)
ON CONFLICT (slug) DO NOTHING;
