-- Viagens e autorizações de menores (assinatura canvas; preparado para Gov.br)

CREATE TABLE IF NOT EXISTS public.travel_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  destination text NOT NULL DEFAULT '',
  departure_at timestamptz NOT NULL,
  return_at timestamptz,
  description text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.travel_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.travel_trips (id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  guardian_name text NOT NULL DEFAULT '',
  guardian_phone text NOT NULL DEFAULT '',
  guardian_document text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'signed', 'revoked')),
  signature_method text NOT NULL DEFAULT 'canvas'
    CHECK (signature_method IN ('canvas', 'govbr')),
  signature_data text,
  signed_at timestamptz,
  signer_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trip_id, member_id)
);

CREATE INDEX IF NOT EXISTS travel_authorizations_member_idx
  ON public.travel_authorizations (member_id);
CREATE INDEX IF NOT EXISTS travel_authorizations_trip_idx
  ON public.travel_authorizations (trip_id);
CREATE INDEX IF NOT EXISTS travel_trips_departure_idx
  ON public.travel_trips (departure_at DESC);

ALTER TABLE public.travel_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_authorizations ENABLE ROW LEVEL SECURITY;

-- Trips: admin full; authenticated members can read active trips linked to their auth
CREATE POLICY travel_trips_select_admin ON public.travel_trips
  FOR SELECT TO authenticated
  USING (public.is_admin() OR is_active = true);

CREATE POLICY travel_trips_insert_admin ON public.travel_trips
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY travel_trips_update_admin ON public.travel_trips
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY travel_trips_delete_admin ON public.travel_trips
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- Authorizations: admin full; member sees/updates own row
CREATE POLICY travel_auth_select ON public.travel_authorizations
  FOR SELECT TO authenticated
  USING (public.is_admin() OR member_id = auth.uid());

CREATE POLICY travel_auth_insert_admin ON public.travel_authorizations
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY travel_auth_update ON public.travel_authorizations
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR (
      member_id = auth.uid()
      AND status = 'pending'
    )
  )
  WITH CHECK (
    public.is_admin()
    OR (
      member_id = auth.uid()
      AND status IN ('pending', 'signed')
    )
  );

CREATE POLICY travel_auth_delete_admin ON public.travel_authorizations
  FOR DELETE TO authenticated
  USING (public.is_admin());
