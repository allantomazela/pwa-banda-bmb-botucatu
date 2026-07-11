INSERT INTO public.site_settings (key, value) VALUES
  ('header_logo_url', '')
ON CONFLICT (key) DO NOTHING;
