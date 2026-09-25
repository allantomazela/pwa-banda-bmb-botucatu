-- Link do Instagram da banda (rodapé / contato)
INSERT INTO public.site_settings (key, value)
VALUES ('instagram_url', 'https://www.instagram.com/bmb.botucatu/')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
