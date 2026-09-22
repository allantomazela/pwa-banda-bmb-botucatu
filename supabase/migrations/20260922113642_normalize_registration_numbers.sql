-- Padroniza matrículas no formato BMB-0001 (4 dígitos) e realinha a sequência.
-- Corrige valores legados como BMB-2026-001 / BMB-2024-001.

CREATE OR REPLACE FUNCTION public.next_registration_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  n bigint;
BEGIN
  n := nextval('public.registration_number_seq');
  RETURN 'BMB-' || to_char(n, 'FM0000');
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_registration_number_seq()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_n bigint;
BEGIN
  SELECT COALESCE(
    MAX((regexp_match(registration_number, '^BMB-([0-9]{4})$'))[1]::bigint),
    0
  )
  INTO max_n
  FROM public.profiles
  WHERE registration_number ~ '^BMB-[0-9]{4}$';

  IF max_n < 1 THEN
    PERFORM setval('public.registration_number_seq', 1, false);
  ELSE
    PERFORM setval('public.registration_number_seq', max_n, true);
  END IF;
END;
$$;

DO $$
DECLARE
  r record;
  candidate_num bigint;
  candidate text;
BEGIN
  ALTER TABLE public.profiles DISABLE TRIGGER protect_profile_approval_fields;

  -- Corrige legados (ex.: BMB-2026-001) e vazios, usando o menor número livre.
  -- Allan (admin fundador) tem prioridade para receber BMB-0001 se estiver livre.
  FOR r IN
    SELECT id, registration_number, full_name, updated_at
    FROM public.profiles
    WHERE registration_number IS NULL
       OR btrim(registration_number) = ''
       OR registration_number !~ '^BMB-[0-9]{4}$'
    ORDER BY
      CASE WHEN lower(full_name) LIKE 'allan tomazela%' THEN 0 ELSE 1 END,
      updated_at NULLS LAST,
      id
  LOOP
    candidate_num := 1;
    LOOP
      candidate := 'BMB-' || to_char(candidate_num, 'FM0000');
      EXIT WHEN NOT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE registration_number = candidate
          AND id <> r.id
      );
      candidate_num := candidate_num + 1;
    END LOOP;

    UPDATE public.profiles
    SET registration_number = candidate,
        updated_at = now()
    WHERE id = r.id;
  END LOOP;

  PERFORM public.sync_registration_number_seq();

  ALTER TABLE public.profiles ENABLE TRIGGER protect_profile_approval_fields;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_registration_number_seq() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_registration_number_seq() TO service_role;
