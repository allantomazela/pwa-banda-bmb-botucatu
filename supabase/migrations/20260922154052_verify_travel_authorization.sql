-- Verificação pública de autorização de viagem (QR no documento impresso)

CREATE OR REPLACE FUNCTION public.verify_travel_authorization(authorization_id uuid)
RETURNS TABLE (
  authorization_id uuid,
  status text,
  is_valid boolean,
  student_name text,
  registration_number text,
  trip_title text,
  destination text,
  departure_at timestamptz,
  return_at timestamptz,
  guardian_name text,
  signature_method text,
  signed_at timestamptz,
  govbr_name text,
  govbr_assurance text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    a.id AS authorization_id,
    a.status,
    (a.status = 'signed') AS is_valid,
    COALESCE(p.full_name, '') AS student_name,
    COALESCE(p.registration_number, '') AS registration_number,
    COALESCE(t.title, '') AS trip_title,
    COALESCE(t.destination, '') AS destination,
    t.departure_at,
    t.return_at,
    COALESCE(NULLIF(btrim(a.guardian_name), ''), a.govbr_name, '') AS guardian_name,
    COALESCE(a.signature_method, '') AS signature_method,
    a.signed_at,
    a.govbr_name,
    a.govbr_assurance
  FROM public.travel_authorizations a
  JOIN public.travel_trips t ON t.id = a.trip_id
  LEFT JOIN public.profiles p ON p.id = a.member_id
  WHERE a.id = authorization_id
    AND a.status IN ('signed', 'revoked');
$$;

COMMENT ON FUNCTION public.verify_travel_authorization(uuid) IS
  'Consulta pública da validade de autorização de viagem (QR do documento impresso).';

GRANT EXECUTE ON FUNCTION public.verify_travel_authorization(uuid) TO anon, authenticated, service_role;
