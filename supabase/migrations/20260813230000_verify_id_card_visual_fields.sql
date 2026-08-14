-- Dados visuais da carteirinha na verificação pública do QR Code

DROP FUNCTION IF EXISTS public.verify_id_card(uuid);

CREATE FUNCTION public.verify_id_card(member_id uuid)
RETURNS TABLE (
  full_name text,
  registration_number text,
  instrument text,
  valid_until date,
  city text,
  state text,
  role text,
  is_valid boolean,
  avatar_url text,
  birth_date date,
  cpf text,
  rg text,
  disability_info text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    p.full_name,
    p.registration_number,
    p.instrument,
    p.valid_until,
    p.city,
    p.state,
    p.role,
    (
      p.approval_status = 'approved'
      AND (p.valid_until IS NULL OR p.valid_until >= CURRENT_DATE)
    ) AS is_valid,
    p.avatar_url,
    p.birth_date,
    p.cpf,
    p.rg,
    p.disability_info
  FROM public.profiles p
  WHERE p.id = member_id
    AND p.approval_status = 'approved';
$$;

GRANT EXECUTE ON FUNCTION public.verify_id_card(uuid) TO anon, authenticated;
