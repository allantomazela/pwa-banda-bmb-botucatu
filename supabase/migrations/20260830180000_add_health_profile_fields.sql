-- Ficha de saúde completa do membro (aditivo; não altera carteirinha pública)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS health_problems text,
  ADD COLUMN IF NOT EXISTS continuous_medications text,
  ADD COLUMN IF NOT EXISTS diseases text,
  ADD COLUMN IF NOT EXISTS surgeries text,
  ADD COLUMN IF NOT EXISTS dietary_restrictions text;

COMMENT ON COLUMN public.profiles.health_problems IS 'Problemas de saúde relevantes';
COMMENT ON COLUMN public.profiles.continuous_medications IS 'Uso contínuo de medicamentos';
COMMENT ON COLUMN public.profiles.diseases IS 'Doenças conhecidas';
COMMENT ON COLUMN public.profiles.surgeries IS 'Cirurgias relevantes';
COMMENT ON COLUMN public.profiles.dietary_restrictions IS 'Restrições alimentares';
