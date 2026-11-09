

DO $$
DECLARE
  target_email TEXT := 'hasib2994@gmail.com'; -- Replace with the administrator's email
  matching_profile_id UUID;
BEGIN
  -- Verify that the user profile exists
  SELECT id INTO matching_profile_id
  FROM public.profiles
  WHERE email = target_email;

  IF matching_profile_id IS NULL THEN
    RAISE EXCEPTION 'Target user "%" not found in public.profiles. The account must first register via the web application before being promoted.', target_email;
  END IF;

  -- Safely promote to admin
  UPDATE public.profiles
  SET 
    role = 'admin',
    updated_at = NOW()
  WHERE id = matching_profile_id;

  RAISE NOTICE 'SUCCESS: User "%" (ID: %) has been promoted to "admin".', target_email, matching_profile_id;
END $$;
