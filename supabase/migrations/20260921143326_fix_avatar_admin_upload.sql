-- Admin pode gerenciar avatars de qualquer membro (upload no painel).
-- Membros continuam limitados à própria pasta {auth.uid()}/*

DROP POLICY IF EXISTS "avatars_upload" ON storage.objects;
CREATE POLICY "avatars_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (
      name LIKE auth.uid()::text || '/%'
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "avatars_update" ON storage.objects;
CREATE POLICY "avatars_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      name LIKE auth.uid()::text || '/%'
      OR public.is_admin()
    )
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (
      name LIKE auth.uid()::text || '/%'
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "avatars_delete" ON storage.objects;
CREATE POLICY "avatars_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      name LIKE auth.uid()::text || '/%'
      OR public.is_admin()
    )
  );

-- Convite de responsável: reaproveita vínculo existente e mensagem clara em duplicata
CREATE OR REPLACE FUNCTION public.invite_guardian_for_student(
  p_student_id uuid,
  p_email text,
  p_relationship text DEFAULT 'Responsável legal'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_email text := lower(btrim(p_email));
  v_id uuid;
  v_existing_role text;
  v_existing_id uuid;
  v_student_role text;
  v_link_id uuid;
  v_link_status text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem convidar responsáveis';
  END IF;

  IF v_email IS NULL OR length(v_email) < 5 OR position('@' IN v_email) = 0 THEN
    RAISE EXCEPTION 'Informe um e-mail válido';
  END IF;

  SELECT id, role INTO v_existing_id, v_existing_role
  FROM public.profiles
  WHERE lower(email) = v_email
  LIMIT 1;

  IF v_existing_role IS NOT NULL AND v_existing_role <> 'guardian' THEN
    RAISE EXCEPTION 'Este e-mail já pertence a um usuário que não é responsável';
  END IF;

  SELECT role INTO v_student_role
  FROM public.profiles
  WHERE id = p_student_id;

  IF v_student_role IS NULL OR v_student_role NOT IN ('member', 'support_group') THEN
    RAISE EXCEPTION 'Só é possível vincular responsável a aluno ou membro do grupo de apoio';
  END IF;

  SELECT id, status INTO v_link_id, v_link_status
  FROM public.guardian_links
  WHERE student_id = p_student_id
    AND lower(invited_email) = v_email
  ORDER BY
    CASE status WHEN 'active' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END,
    created_at DESC
  LIMIT 1;

  IF v_link_id IS NOT NULL AND v_link_status IN ('pending', 'active') THEN
    IF v_existing_role = 'guardian' THEN
      UPDATE public.guardian_links
      SET status = 'active',
          activated_at = COALESCE(activated_at, now()),
          guardian_id = v_existing_id,
          relationship = COALESCE(NULLIF(btrim(p_relationship), ''), relationship)
      WHERE id = v_link_id;
      PERFORM public.sync_student_guardian_contact(p_student_id);
    END IF;
    RETURN v_link_id;
  END IF;

  IF v_link_id IS NOT NULL AND v_link_status = 'revoked' THEN
    UPDATE public.guardian_links
    SET status = CASE WHEN v_existing_role = 'guardian' THEN 'active' ELSE 'pending' END,
        activated_at = CASE WHEN v_existing_role = 'guardian' THEN now() ELSE NULL END,
        guardian_id = CASE WHEN v_existing_role = 'guardian' THEN v_existing_id ELSE NULL END,
        relationship = COALESCE(NULLIF(btrim(p_relationship), ''), 'Responsável legal'),
        created_by = auth.uid()
    WHERE id = v_link_id
    RETURNING id INTO v_id;

    IF v_existing_role = 'guardian' THEN
      PERFORM public.sync_student_guardian_contact(p_student_id);
    END IF;
    RETURN v_id;
  END IF;

  INSERT INTO public.guardian_links (
    student_id, invited_email, relationship, status, created_by, guardian_id
  )
  VALUES (
    p_student_id,
    v_email,
    COALESCE(NULLIF(btrim(p_relationship), ''), 'Responsável legal'),
    'pending',
    auth.uid(),
    CASE WHEN v_existing_role = 'guardian' THEN v_existing_id ELSE NULL END
  )
  RETURNING id INTO v_id;

  IF v_existing_role = 'guardian' THEN
    UPDATE public.guardian_links
    SET status = 'active',
        activated_at = now(),
        guardian_id = v_existing_id
    WHERE id = v_id;

    PERFORM public.sync_student_guardian_contact(p_student_id);
  END IF;

  RETURN v_id;
END;
$$;
