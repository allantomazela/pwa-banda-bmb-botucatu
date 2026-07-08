DO $$
DECLARE
  seed_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'allantomazela@gmail.com') THEN
    seed_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      seed_user_id,
      '00000000-0000-0000-0000-000000000000',
      'allantomazela@gmail.com',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Allan Tomazela", "instrument": "Trompete", "registration_number": "BMB-2024-001", "avatar_url": "https://img.usecurling.com/ppl/medium?gender=male&seed=1"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
  END IF;
END $$;

-- Fix any NULL token columns in auth.users that could cause login failures
UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE
  confirmation_token IS NULL OR recovery_token IS NULL
  OR email_change_token_new IS NULL OR email_change IS NULL
  OR email_change_token_current IS NULL
  OR phone_change IS NULL OR phone_change_token IS NULL
  OR reauthentication_token IS NULL;

INSERT INTO public.videos (id, title, video_url, description, category) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'Postura Corporal na Marcha', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Fundamentos de postura e movimento para a execução perfeita durante as apresentações em desfiles e campeonatos.', 'Método I'),
  ('d0000002-0000-0000-0000-000000000001', 'Leitura Rítmica Básica', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Exercícios de leitura musical para iniciantes se familiarizarem com os tempos e compassos.', 'Método I'),
  ('d0000003-0000-0000-0000-000000000001', 'Técnica Avançada de Improvisação', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Para músicos com mais experiência desenvolverem a criatividade nos solos.', 'Método II'),
  ('d0000004-0000-0000-0000-000000000001', 'Coreografia - Peça de Confronto', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Revisão dos movimentos do compasso 40 ao 80 da música principal do campeonato.', 'Método II'),
  ('d0000005-0000-0000-0000-000000000001', 'Aquecimento Diário de Metais', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Rotina de 15 minutos para preparar os lábios e a respiração.', 'Instrumento')
ON CONFLICT (id) DO NOTHING;
