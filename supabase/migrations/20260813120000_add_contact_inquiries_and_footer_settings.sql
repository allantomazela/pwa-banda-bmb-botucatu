-- Leads de interesse (formulário público /contato)
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  instrument TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_inquiries_insert_public" ON public.contact_inquiries;
CREATE POLICY "contact_inquiries_insert_public" ON public.contact_inquiries
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "contact_inquiries_select_admin" ON public.contact_inquiries;
CREATE POLICY "contact_inquiries_select_admin" ON public.contact_inquiries
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "contact_inquiries_update_admin" ON public.contact_inquiries;
CREATE POLICY "contact_inquiries_update_admin" ON public.contact_inquiries
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "contact_inquiries_delete_admin" ON public.contact_inquiries;
CREATE POLICY "contact_inquiries_delete_admin" ON public.contact_inquiries
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- Campos extras de contato/rodapé editáveis no admin
INSERT INTO public.site_settings (key, value) VALUES
  ('contact_phone', '(14) 99999-9999'),
  ('footer_address', 'Rua da Música, 123 - Centro'),
  ('footer_city', 'Botucatu - SP, 18600-000')
ON CONFLICT (key) DO NOTHING;
