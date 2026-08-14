-- Patrocinadores visíveis no site e formulário de interesse (write admin / insert público)

CREATE TABLE IF NOT EXISTS public.sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text NOT NULL DEFAULT '',
  website_url text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'patrocinador',
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sponsors_kind_check CHECK (kind IN ('patrocinador', 'apoiador'))
);

CREATE TABLE IF NOT EXISTS public.sponsor_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL DEFAULT '',
  phone text NOT NULL,
  company text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sponsor_inquiries_status_check CHECK (status IN ('new', 'contacted', 'closed'))
);

CREATE INDEX IF NOT EXISTS sponsors_visible_sort_idx
  ON public.sponsors (is_visible, sort_order, created_at);

ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sponsors_select_public ON public.sponsors;
CREATE POLICY sponsors_select_public ON public.sponsors
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS sponsors_insert_admin ON public.sponsors;
CREATE POLICY sponsors_insert_admin ON public.sponsors
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS sponsors_update_admin ON public.sponsors;
CREATE POLICY sponsors_update_admin ON public.sponsors
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS sponsors_delete_admin ON public.sponsors;
CREATE POLICY sponsors_delete_admin ON public.sponsors
  FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS sponsor_inquiries_insert_public ON public.sponsor_inquiries;
CREATE POLICY sponsor_inquiries_insert_public ON public.sponsor_inquiries
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS sponsor_inquiries_select_admin ON public.sponsor_inquiries;
CREATE POLICY sponsor_inquiries_select_admin ON public.sponsor_inquiries
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS sponsor_inquiries_update_admin ON public.sponsor_inquiries;
CREATE POLICY sponsor_inquiries_update_admin ON public.sponsor_inquiries
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS sponsor_inquiries_delete_admin ON public.sponsor_inquiries;
CREATE POLICY sponsor_inquiries_delete_admin ON public.sponsor_inquiries
  FOR DELETE TO authenticated USING (public.is_admin());

INSERT INTO public.site_pages (slug, title, nav_label, show_in_nav, is_system, sort_order)
VALUES ('patrocinadores', 'Patrocinadores', 'Patrocínio', false, true, 5)
ON CONFLICT (slug) DO NOTHING;
