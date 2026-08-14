-- Fundo sólido ou degradê no card de cada patrocinador

ALTER TABLE public.sponsors
  ADD COLUMN IF NOT EXISTS bg_type text NOT NULL DEFAULT 'solid',
  ADD COLUMN IF NOT EXISTS bg_color text NOT NULL DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS bg_color_end text NOT NULL DEFAULT '#ffffff';

ALTER TABLE public.sponsors DROP CONSTRAINT IF EXISTS sponsors_bg_type_check;
ALTER TABLE public.sponsors
  ADD CONSTRAINT sponsors_bg_type_check CHECK (bg_type IN ('solid', 'gradient'));
