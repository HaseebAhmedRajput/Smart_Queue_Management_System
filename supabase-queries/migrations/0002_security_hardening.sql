-- -- Prevent users from changing their own role or shelf assignment.
-- CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
-- RETURNS TRIGGER
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path = public
-- AS $$
-- BEGIN
--   -- Admins can manage profile roles and shelf assignments.
--   IF public.auth_user_role() = 'admin' THEN
--     RETURN NEW;
--   END IF;

--   -- A normal user cannot change their own role or assigned shelf.
--   IF auth.uid() = OLD.id THEN
--     IF NEW.role IS DISTINCT FROM OLD.role THEN
--       RAISE EXCEPTION 'You cannot change your own role';
--     END IF;

--     IF NEW.assigned_shelf_id IS DISTINCT FROM OLD.assigned_shelf_id THEN
--       RAISE EXCEPTION 'You cannot change your own shelf assignment';
--     END IF;

--     RETURN NEW;
--   END IF;

--   -- Block any other non-admin profile modification.
--   RAISE EXCEPTION 'Not authorized to update this profile';
-- END;
-- $$;

-- DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation
-- ON public.profiles;

-- CREATE TRIGGER trg_prevent_profile_privilege_escalation
-- BEFORE UPDATE ON public.profiles
-- FOR EACH ROW
-- EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- REVOKE ALL ON FUNCTION public.prevent_profile_privilege_escalation()
-- FROM PUBLIC, anon;

-- GRANT EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation()
-- TO authenticated;




-- 2nd query
DROP FUNCTION IF EXISTS public.assign_shelf_to_officer(uuid, uuid);



-- 3rd Query
CREATE FUNCTION public.assign_shelf_to_officer(
  p_profile_id UUID,
  p_shelf_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_target_role TEXT;
  v_previous_officer_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can assign counters';
  END IF;

  SELECT role
  INTO v_target_role
  FROM public.profiles
  WHERE id = p_profile_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Officer profile not found';
  END IF;

  IF v_target_role <> 'operation_officer' THEN
    RAISE EXCEPTION 'Selected account is not an operation officer';
  END IF;

  IF p_shelf_id IS NOT NULL THEN
    SELECT current_officer_id
    INTO v_previous_officer_id
    FROM public.shelves
    WHERE id = p_shelf_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Counter not found';
    END IF;
  END IF;

  UPDATE public.shelves
  SET current_officer_id = NULL
  WHERE current_officer_id = p_profile_id
    AND (p_shelf_id IS NULL OR id <> p_shelf_id);

  IF p_shelf_id IS NOT NULL
     AND v_previous_officer_id IS NOT NULL
     AND v_previous_officer_id <> p_profile_id THEN

    UPDATE public.profiles
    SET assigned_shelf_id = NULL,
        updated_at = NOW()
    WHERE id = v_previous_officer_id
      AND assigned_shelf_id = p_shelf_id;
  END IF;

  UPDATE public.profiles
  SET assigned_shelf_id = p_shelf_id,
      updated_at = NOW()
  WHERE id = p_profile_id;

  IF p_shelf_id IS NOT NULL THEN
    UPDATE public.shelves
    SET current_officer_id = p_profile_id
    WHERE id = p_shelf_id;
  END IF;
END;
$function$;







-- 4rth query
NOTIFY pgrst, 'reload schema';



-- 5th query
CREATE OR REPLACE FUNCTION public.validate_floor_before_token_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service must be active and have at least one eligible
  -- active counter on an active floor.
  IF NOT EXISTS (
    SELECT 1
    FROM public.services s
    JOIN public.shelves sh
      ON (
        COALESCE(cardinality(sh.service_ids), 0) = 0
        OR NEW.service_id = ANY(sh.service_ids)
      )
    JOIN public.floors f
      ON f.id = sh.floor_id
    WHERE s.id = NEW.service_id
      AND s.is_active = TRUE
      AND sh.is_active = TRUE
      AND f.is_active = TRUE
  ) THEN
    RAISE EXCEPTION
      'This service is currently unavailable because no active counter is available please try on working hours.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_floor_before_token_insert
ON public.tokens;

CREATE TRIGGER trg_validate_floor_before_token_insert
BEFORE INSERT ON public.tokens
FOR EACH ROW
EXECUTE FUNCTION public.validate_floor_before_token_insert();