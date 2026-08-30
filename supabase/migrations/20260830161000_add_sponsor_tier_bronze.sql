-- Inclui nível Bronze na hierarquia de patrocínio

ALTER TABLE public.sponsors DROP CONSTRAINT IF EXISTS sponsors_tier_check;
ALTER TABLE public.sponsors
  ADD CONSTRAINT sponsors_tier_check CHECK (tier IN ('master', 'ouro', 'prata', 'bronze', 'apoiador'));
