-- Restaura Allan Tomazela como administrador e impede
-- demover/excluir o último Administrador do Sistema.
-- Desabilita temporariamente o trigger de proteção de campos porque,
-- sem nenhum admin, is_admin() bloqueia qualquer UPDATE de role.

ALTER TABLE public.profiles DISABLE TRIGGER protect_profile_approval_fields;

UPDATE public.profiles
SET
  role = 'admin',
  updated_at = now()
WHERE email = 'allantomazela@gmail.com'
  AND role IS DISTINCT FROM 'admin';

ALTER TABLE public.profiles ENABLE TRIGGER protect_profile_approval_fields;

CREATE OR REPLACE FUNCTION public.ensure_at_least_one_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  remaining_admins integer;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.role = 'admin' AND NEW.role IS DISTINCT FROM 'admin' THEN
      SELECT COUNT(*)::integer INTO remaining_admins
      FROM public.profiles
      WHERE role = 'admin'
        AND id IS DISTINCT FROM OLD.id;

      IF remaining_admins < 1 THEN
        RAISE EXCEPTION
          'Não é permitido remover o último Administrador do Sistema. Promova outro membro a administrador antes.';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'admin' THEN
      SELECT COUNT(*)::integer INTO remaining_admins
      FROM public.profiles
      WHERE role = 'admin'
        AND id IS DISTINCT FROM OLD.id;

      IF remaining_admins < 1 THEN
        RAISE EXCEPTION
          'Não é permitido excluir o último Administrador do Sistema. Promova outro membro a administrador antes.';
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_at_least_one_admin ON public.profiles;

CREATE TRIGGER trg_ensure_at_least_one_admin
  BEFORE UPDATE OF role OR DELETE
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_at_least_one_admin();

COMMENT ON FUNCTION public.ensure_at_least_one_admin() IS
  'Garante que sempre exista ao menos um perfil com role=admin.';
