-- Níveis comerciais de patrocínio: Master, Ouro, Prata e Apoiador

ALTER TABLE public.sponsors
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'ouro';

ALTER TABLE public.sponsors DROP CONSTRAINT IF EXISTS sponsors_tier_check;
ALTER TABLE public.sponsors
  ADD CONSTRAINT sponsors_tier_check CHECK (tier IN ('master', 'ouro', 'prata', 'apoiador'));

UPDATE public.sponsors
SET tier = CASE
  WHEN kind = 'apoiador' THEN 'apoiador'
  ELSE COALESCE(NULLIF(tier, ''), 'ouro')
END;
