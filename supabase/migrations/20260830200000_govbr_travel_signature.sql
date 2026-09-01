-- Assinatura de viagem via Login Único Gov.br (identidade verificada; canvas permanece)

ALTER TABLE public.travel_authorizations
  ADD COLUMN IF NOT EXISTS govbr_sub text,
  ADD COLUMN IF NOT EXISTS govbr_name text,
  ADD COLUMN IF NOT EXISTS govbr_email text,
  ADD COLUMN IF NOT EXISTS govbr_assurance text,
  ADD COLUMN IF NOT EXISTS signature_evidence jsonb;

CREATE TABLE IF NOT EXISTS public.govbr_oauth_states (
  state text PRIMARY KEY,
  code_verifier text NOT NULL,
  nonce text NOT NULL,
  authorization_id uuid NOT NULL REFERENCES public.travel_authorizations (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS govbr_oauth_states_expires_idx
  ON public.govbr_oauth_states (expires_at);

ALTER TABLE public.govbr_oauth_states ENABLE ROW LEVEL SECURITY;

-- Somente service role (Edge Functions) acessa estados OAuth
REVOKE ALL ON public.govbr_oauth_states FROM anon, authenticated;
GRANT ALL ON public.govbr_oauth_states TO service_role;

INSERT INTO public.site_settings (key, value)
VALUES ('govbr_signing_enabled', 'false')
ON CONFLICT (key) DO NOTHING;

-- Limpeza de estados expirados (opcional, chamável pelo cron ou edge)
CREATE OR REPLACE FUNCTION public.cleanup_expired_govbr_oauth_states()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer;
BEGIN
  DELETE FROM public.govbr_oauth_states WHERE expires_at < now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_expired_govbr_oauth_states() TO service_role;
