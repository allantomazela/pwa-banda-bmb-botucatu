-- Membro honorário (carteirinha dourada)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'member',
    'professor',
    'admin',
    'guardian',
    'support_group',
    'honorary_member'
  ));

COMMENT ON CONSTRAINT profiles_role_check ON public.profiles IS
  'member, professor, admin, guardian, support_group, honorary_member=Membro Honorário';
