-- Flyer/cartaz de divulgação vinculado ao evento da agenda
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS image_url text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.events.image_url IS
  'URL do flyer/cartaz de divulgação do evento';
