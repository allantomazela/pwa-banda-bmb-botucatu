-- Ensure seed user's profile has complete data
-- Previous migrations may have created an incomplete profile via the handle_new_user trigger
-- (only full_name was inserted), and ON CONFLICT DO NOTHING prevented the full insert.
UPDATE public.profiles
SET
  full_name = 'Allan Tomazela',
  instrument = COALESCE(NULLIF(instrument, ''), 'Trompete'),
  registration_number = COALESCE(NULLIF(registration_number, ''), 'BMB-2024-001'),
  avatar_url = COALESCE(NULLIF(avatar_url, ''), 'https://img.usecurling.com/ppl/medium?gender=male&seed=1')
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'allantomazela@gmail.com'
);
