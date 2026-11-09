
-- SMART QUEUE & APPOINTMENT MANAGEMENT SYSTEM

 --1st query to runn on supabase sql editor 
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM (
    'user', 'token_operator', 'operation_officer', 'admin'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.token_status AS ENUM (
    'pending', 'called', 'working',
    'successful', 'rejected', 'skipped', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. TOKEN SEQUENCE
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS public.token_number_seq
  START WITH 1001 INCREMENT BY 1;

-- ============================================================
-- 3. TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'user',
  assigned_shelf_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  national_id_or_passport TEXT NOT NULL,
  date_of_birth DATE,
  phone TEXT,
  relationship TEXT NOT NULL DEFAULT 'self',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.floors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  floor_number INT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  estimated_duration_minutes INT NOT NULL DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shelves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id UUID NOT NULL REFERENCES public.floors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  shelf_number INT NOT NULL,
  service_ids UUID[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_paused BOOLEAN NOT NULL DEFAULT FALSE,
  current_officer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (floor_id, shelf_number)
);

CREATE TABLE IF NOT EXISTS public.tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_number TEXT NOT NULL UNIQUE,
  sequence_number BIGINT NOT NULL,
  applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE RESTRICT,
  account_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  floor_id UUID REFERENCES public.floors(id) ON DELETE SET NULL,
  shelf_id UUID REFERENCES public.shelves(id) ON DELETE SET NULL,
  officer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status public.token_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  called_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  skip_reason TEXT,
  is_walk_in BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.token_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  shelf_id UUID NOT NULL REFERENCES public.shelves(id) ON DELETE CASCADE,
  officer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  assignment_type TEXT NOT NULL DEFAULT 'auto'
);

CREATE TABLE IF NOT EXISTS public.token_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role TEXT NOT NULL,
  previous_status public.token_status,
  new_status public.token_status NOT NULL,
  event_type TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_profiles_assigned_shelf'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT fk_profiles_assigned_shelf
      FOREIGN KEY (assigned_shelf_id)
      REFERENCES public.shelves(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- 4. INDEXES
-- ============================================================

-- One active token per applicant/service per Pakistan calendar day.
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_token_per_applicant_service
ON public.tokens (
  applicant_id,
  service_id,
  ((created_at AT TIME ZONE 'Asia/Karachi')::date)
)
WHERE status IN ('pending', 'called', 'working');

CREATE UNIQUE INDEX IF NOT EXISTS idx_exclusive_active_shelf_token
ON public.tokens (shelf_id)
WHERE status IN ('called', 'working') AND shelf_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tokens_fifo
ON public.tokens (created_at ASC, sequence_number ASC)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_tokens_status_service
ON public.tokens (status, service_id);

CREATE INDEX IF NOT EXISTS idx_tokens_shelf_status
ON public.tokens (shelf_id, status);

CREATE INDEX IF NOT EXISTS idx_token_events_token_id
ON public.token_events (token_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_token_assignments_token_id
ON public.token_assignments (token_id, assigned_at DESC);

CREATE INDEX IF NOT EXISTS idx_applicants_account_id
ON public.applicants (account_id);

CREATE INDEX IF NOT EXISTS idx_tokens_account_id
ON public.tokens (account_id);

CREATE INDEX IF NOT EXISTS idx_tokens_applicant_id
ON public.tokens (applicant_id);

CREATE INDEX IF NOT EXISTS idx_tokens_service_id
ON public.tokens (service_id);

CREATE INDEX IF NOT EXISTS idx_shelves_floor_id
ON public.shelves (floor_id);

CREATE INDEX IF NOT EXISTS idx_shelves_current_officer_id
ON public.shelves (current_officer_id);

-- ============================================================
-- 5. AUTH / ROLE HELPER
-- ============================================================

CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.role
  FROM public.profiles p
  WHERE p.id = auth.uid()
  LIMIT 1;
$$;

-- ============================================================
-- 6. TOKEN NUMBER GENERATION
-- ============================================================

CREATE OR REPLACE FUNCTION public.assign_token_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_sequence BIGINT;
BEGIN
  SELECT s.code INTO v_code
  FROM public.services s
  WHERE s.id = NEW.service_id
    AND s.is_active = TRUE;

  IF v_code IS NULL THEN
    RAISE EXCEPTION 'Selected service not found or inactive';
  END IF;

  v_sequence := nextval('public.token_number_seq');

  NEW.sequence_number := v_sequence;
  NEW.display_number := v_code || '-' || v_sequence::TEXT;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_token_number ON public.tokens;

CREATE TRIGGER trg_assign_token_number
BEFORE INSERT ON public.tokens
FOR EACH ROW
EXECUTE FUNCTION public.assign_token_number();

-- ============================================================
-- 7. TOKEN STATUS VALIDATION
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_token_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.status IN ('successful', 'rejected', 'skipped', 'cancelled') THEN
    RAISE EXCEPTION
      'Cannot modify token %: terminal status (%) cannot be reopened or reused',
      OLD.id, OLD.status;
  END IF;

  IF OLD.status = 'pending'
     AND NEW.status NOT IN ('pending', 'called', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid transition from pending to %', NEW.status;
  END IF;

  IF OLD.status = 'called' THEN
    IF NEW.status NOT IN ('called', 'working', 'skipped', 'rejected') THEN
      RAISE EXCEPTION 'Invalid transition from called to %', NEW.status;
    END IF;

    IF NEW.status = 'skipped' THEN
      IF OLD.called_at IS NULL
         OR NOW() < OLD.called_at + INTERVAL '120 seconds' THEN
        RAISE EXCEPTION 'The 120-second no-show period has not elapsed';
      END IF;
    END IF;
  END IF;

  IF OLD.status = 'working'
     AND NEW.status NOT IN ('working', 'successful', 'rejected') THEN
    RAISE EXCEPTION 'Invalid transition from working to %', NEW.status;
  END IF;

  IF NEW.status = 'rejected'
     AND (NEW.rejection_reason IS NULL
          OR TRIM(NEW.rejection_reason) = '') THEN
    RAISE EXCEPTION 'Mandatory rejection reason is required for token %', NEW.id;
  END IF;

  IF NEW.status = 'called'
     AND OLD.status IS DISTINCT FROM 'called'
     AND NEW.called_at IS NULL THEN
    NEW.called_at := NOW();
  END IF;

  IF NEW.status = 'working'
     AND OLD.status IS DISTINCT FROM 'working'
     AND NEW.started_at IS NULL THEN
    NEW.started_at := NOW();
  END IF;

  IF NEW.status IN ('successful', 'rejected', 'skipped', 'cancelled')
     AND NEW.completed_at IS NULL THEN
    NEW.completed_at := NOW();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_token_transition ON public.tokens;

CREATE TRIGGER trg_validate_token_transition
BEFORE UPDATE ON public.tokens
FOR EACH ROW
EXECUTE FUNCTION public.validate_token_status_transition();

-- ============================================================
-- 8. TOKEN EVENT LOGGING
-- ============================================================

CREATE OR REPLACE FUNCTION public.log_token_status_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.token_events (
      token_id, actor_id, actor_role,
      previous_status, new_status, event_type, notes
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.officer_id, auth.uid()),
      COALESCE(
        (SELECT p.role::TEXT FROM public.profiles p WHERE p.id = auth.uid()),
        'system'
      ),
      OLD.status,
      NEW.status,
      'STATUS_CHANGE_' || UPPER(NEW.status::TEXT),
      COALESCE(
        NEW.rejection_reason,
        NEW.skip_reason,
        'Status changed to ' || NEW.status::TEXT
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_token_status_event ON public.tokens;

CREATE TRIGGER trg_log_token_status_event
AFTER UPDATE ON public.tokens
FOR EACH ROW
EXECUTE FUNCTION public.log_token_status_event();

-- ============================================================
-- 9. INTERNAL ATOMIC FIFO DISPATCH
-- ============================================================

CREATE OR REPLACE FUNCTION public._dispatch_next_token_atomic(p_shelf_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shelf public.shelves%ROWTYPE;
  v_token public.tokens%ROWTYPE;
  v_officer_role TEXT;
BEGIN
  SELECT * INTO v_shelf
  FROM public.shelves
  WHERE id = p_shelf_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', FALSE, 'dispatched', FALSE, 'message', 'Counter not found'
    );
  END IF;

  IF NOT v_shelf.is_active OR v_shelf.is_paused THEN
    RETURN jsonb_build_object(
      'success', TRUE, 'dispatched', FALSE,
      'message', 'Counter is inactive or paused'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.floors f
    WHERE f.id = v_shelf.floor_id AND f.is_active = TRUE
  ) THEN
    RETURN jsonb_build_object(
      'success', TRUE, 'dispatched', FALSE, 'message', 'Floor is inactive'
    );
  END IF;

  IF v_shelf.current_officer_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', TRUE, 'dispatched', FALSE,
      'message', 'No operation officer assigned'
    );
  END IF;

  SELECT p.role::TEXT INTO v_officer_role
  FROM public.profiles p
  WHERE p.id = v_shelf.current_officer_id;

  IF v_officer_role IS DISTINCT FROM 'operation_officer' THEN
    RETURN jsonb_build_object(
      'success', TRUE, 'dispatched', FALSE,
      'message', 'Assigned account is not an operation officer'
    );
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.tokens t
    WHERE t.shelf_id = p_shelf_id
      AND t.status IN ('called', 'working')
  ) THEN
    RETURN jsonb_build_object(
      'success', TRUE, 'dispatched', FALSE,
      'message', 'Counter already has an active token'
    );
  END IF;

  SELECT t.* INTO v_token
  FROM public.tokens t
  JOIN public.services s ON s.id = t.service_id
  WHERE t.status = 'pending'
    AND s.is_active = TRUE
    AND (
      COALESCE(cardinality(v_shelf.service_ids), 0) = 0
      OR t.service_id = ANY(v_shelf.service_ids)
    )
  ORDER BY t.created_at ASC, t.sequence_number ASC, t.id ASC
  FOR UPDATE OF t SKIP LOCKED
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', TRUE, 'dispatched', FALSE,
      'message', 'No eligible pending token'
    );
  END IF;

  UPDATE public.tokens
  SET status = 'called',
      shelf_id = v_shelf.id,
      floor_id = v_shelf.floor_id,
      officer_id = v_shelf.current_officer_id,
      called_at = NOW()
  WHERE id = v_token.id
  RETURNING * INTO v_token;

  INSERT INTO public.token_assignments (
    token_id, shelf_id, officer_id,
    assigned_at, released_at, assignment_type
  )
  VALUES (
    v_token.id, v_shelf.id, v_shelf.current_officer_id,
    NOW(), NULL, 'auto'
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'dispatched', TRUE,
    'message', 'Token dispatched successfully',
    'token_id', v_token.id,
    'display_number', v_token.display_number,
    'shelf_id', v_shelf.id,
    'shelf_name', v_shelf.name,
    'floor_id', v_shelf.floor_id,
    'officer_id', v_shelf.current_officer_id
  );
END;
$$;

-- ============================================================
-- 10. MANUAL DISPATCH RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.dispatch_next_token_atomic(p_shelf_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_officer_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_role := public.auth_user_role()::TEXT;

  IF v_role = 'admin' THEN
    RETURN public._dispatch_next_token_atomic(p_shelf_id);
  END IF;

  IF v_role IS DISTINCT FROM 'operation_officer' THEN
    RAISE EXCEPTION 'Only admins and operation officers can dispatch tokens';
  END IF;

  SELECT s.current_officer_id INTO v_officer_id
  FROM public.shelves s
  WHERE s.id = p_shelf_id;

  IF v_officer_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'You are not assigned to this counter';
  END IF;

  RETURN public._dispatch_next_token_atomic(p_shelf_id);
END;
$$;

-- ============================================================
-- 11. AUTOMATIC DISPATCH
-- ============================================================

CREATE OR REPLACE FUNCTION public.auto_dispatch_pending_tokens()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shelf_id UUID;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('smart_queue_auto_dispatch'));

  FOR v_shelf_id IN
    SELECT sh.id
    FROM public.shelves sh
    JOIN public.floors f ON f.id = sh.floor_id
    JOIN public.profiles p ON p.id = sh.current_officer_id
    WHERE sh.is_active = TRUE
      AND sh.is_paused = FALSE
      AND f.is_active = TRUE
      AND p.role = 'operation_officer'
    ORDER BY f.floor_number, sh.shelf_number, sh.id
  LOOP
    PERFORM public._dispatch_next_token_atomic(v_shelf_id);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_auto_dispatch_after_token_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.auto_dispatch_pending_tokens();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_dispatch_after_token_insert ON public.tokens;

CREATE TRIGGER trg_auto_dispatch_after_token_insert
AFTER INSERT ON public.tokens
FOR EACH ROW
EXECUTE FUNCTION public.trigger_auto_dispatch_after_token_insert();

CREATE OR REPLACE FUNCTION public.trigger_auto_dispatch_after_token_release()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.token_assignments
  SET released_at = COALESCE(released_at, NOW())
  WHERE token_id = NEW.id AND released_at IS NULL;

  PERFORM public.auto_dispatch_pending_tokens();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_dispatch_after_token_release ON public.tokens;

CREATE TRIGGER trg_auto_dispatch_after_token_release
AFTER UPDATE OF status ON public.tokens
FOR EACH ROW
WHEN (
  OLD.status IS DISTINCT FROM NEW.status
  AND OLD.status IN ('pending', 'called', 'working')
  AND NEW.status IN ('successful', 'rejected', 'skipped', 'cancelled')
)
EXECUTE FUNCTION public.trigger_auto_dispatch_after_token_release();

CREATE OR REPLACE FUNCTION public.trigger_auto_dispatch_after_shelf_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active = TRUE
     AND NEW.is_paused = FALSE
     AND NEW.current_officer_id IS NOT NULL THEN
    PERFORM public.auto_dispatch_pending_tokens();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_dispatch_after_shelf_insert ON public.shelves;

CREATE TRIGGER trg_auto_dispatch_after_shelf_insert
AFTER INSERT ON public.shelves
FOR EACH ROW
EXECUTE FUNCTION public.trigger_auto_dispatch_after_shelf_change();

DROP TRIGGER IF EXISTS trg_auto_dispatch_after_shelf_update ON public.shelves;

CREATE TRIGGER trg_auto_dispatch_after_shelf_update
AFTER UPDATE OF is_active, is_paused, current_officer_id, service_ids, floor_id
ON public.shelves
FOR EACH ROW
EXECUTE FUNCTION public.trigger_auto_dispatch_after_shelf_change();

-- ============================================================
-- 12. OFFICER TOKEN ACTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_officer_token_action(
  p_token_id UUID,
  p_action TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token public.tokens%ROWTYPE;
  v_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role::TEXT INTO v_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_role NOT IN ('admin', 'operation_officer') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_action NOT IN ('rejected', 'skipped') THEN
    RAISE EXCEPTION 'Invalid action';
  END IF;

  IF p_action = 'rejected'
     AND (p_reason IS NULL OR LENGTH(TRIM(p_reason)) = 0) THEN
    RAISE EXCEPTION 'A rejection reason is required';
  END IF;

  SELECT * INTO v_token
  FROM public.tokens
  WHERE id = p_token_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Token not found';
  END IF;

  IF v_role = 'operation_officer' AND NOT EXISTS (
    SELECT 1
    FROM public.shelves s
    WHERE s.id = v_token.shelf_id
      AND s.current_officer_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'This token is not assigned to your counter';
  END IF;

  IF p_action = 'skipped' THEN
    IF v_token.status <> 'called' THEN
      RAISE EXCEPTION 'Only called tokens can be skipped';
    END IF;

    IF v_token.called_at IS NULL
       OR NOW() < v_token.called_at + INTERVAL '120 seconds' THEN
      RAISE EXCEPTION 'The 120-second no-show period has not elapsed';
    END IF;

    UPDATE public.tokens
    SET status = 'skipped',
        skip_reason = 'Exceeded 120-second no-show response window',
        completed_at = NOW()
    WHERE id = p_token_id;

  ELSE
    IF v_token.status NOT IN ('called', 'working') THEN
      RAISE EXCEPTION 'Only called or working tokens can be rejected';
    END IF;

    UPDATE public.tokens
    SET status = 'rejected',
        rejection_reason = TRIM(p_reason),
        completed_at = NOW()
    WHERE id = p_token_id;
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', CASE
      WHEN p_action = 'skipped' THEN 'Token marked as no-show'
      ELSE 'Token rejected successfully'
    END
  );
END;
$$;

-- ============================================================
-- 13. START TOKEN WORK
-- ============================================================

CREATE OR REPLACE FUNCTION public.start_token_work(p_token_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_token public.tokens%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role::TEXT INTO v_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_role NOT IN ('admin', 'operation_officer') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_token
  FROM public.tokens
  WHERE id = p_token_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Token not found';
  END IF;

  IF v_role = 'operation_officer' AND NOT EXISTS (
    SELECT 1 FROM public.shelves s
    WHERE s.id = v_token.shelf_id
      AND s.current_officer_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'This token is not assigned to your counter';
  END IF;

  IF v_token.status <> 'called' THEN
    RAISE EXCEPTION 'Only called tokens can be started';
  END IF;

  UPDATE public.tokens
  SET status = 'working',
      started_at = NOW()
  WHERE id = p_token_id;

  RETURN jsonb_build_object('success', TRUE);
END;
$$;

-- ============================================================
-- 14. SHELF ASSIGNMENT
-- ============================================================

CREATE OR REPLACE FUNCTION public.assign_shelf_to_officer(
  p_officer_id UUID,
  p_shelf_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_officer_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_role := public.auth_user_role()::TEXT;

  IF v_role <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can assign counters';
  END IF;

  SELECT role::TEXT INTO v_officer_role
  FROM public.profiles
  WHERE id = p_officer_id;

  IF v_officer_role IS DISTINCT FROM 'operation_officer' THEN
    RAISE EXCEPTION 'Selected account is not an operation officer';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.shelves WHERE id = p_shelf_id
  ) THEN
    RAISE EXCEPTION 'Counter not found';
  END IF;

  UPDATE public.shelves
  SET current_officer_id = p_officer_id
  WHERE id = p_shelf_id;

  UPDATE public.profiles
  SET assigned_shelf_id = p_shelf_id,
      updated_at = NOW()
  WHERE id = p_officer_id;

  PERFORM public.auto_dispatch_pending_tokens();

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Counter assigned successfully'
  );
END;
$$;

-- ============================================================
-- 15. PUBLIC LIVE QUEUE
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_public_live_queue()
RETURNS TABLE (
  id UUID,
  display_number TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  called_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  service_id UUID,
  service_name TEXT,
  service_code TEXT,
  shelf_id UUID,
  shelf_name TEXT,
  shelf_number INTEGER,
  shelf_is_paused BOOLEAN,
  floor_id UUID,
  floor_name TEXT,
  floor_number INTEGER
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    t.id,
    t.display_number,
    t.status::TEXT,
    t.created_at,
    t.called_at,
    t.started_at,
    t.completed_at,
    t.service_id,
    s.name,
    s.code,
    sh.id,
    sh.name,
    sh.shelf_number,
    sh.is_paused,
    f.id,
    f.name,
    f.floor_number
  FROM public.tokens AS t
  LEFT JOIN public.services AS s ON s.id = t.service_id
  LEFT JOIN public.shelves AS sh ON sh.id = t.shelf_id
  LEFT JOIN public.floors AS f
    ON f.id = COALESCE(t.floor_id, sh.floor_id)
  WHERE t.status IN (
    'pending'::public.token_status,
    'called'::public.token_status,
    'working'::public.token_status
  )
  ORDER BY
    CASE t.status
      WHEN 'called'::public.token_status THEN 1
      WHEN 'working'::public.token_status THEN 2
      WHEN 'pending'::public.token_status THEN 3
    END,
    t.created_at ASC;
$$;

-- ============================================================
-- 16. PROFILE CREATION + PRIVILEGE PROTECTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      split_part(NEW.email, '@', 1)
    ),
    'user'
  )
  ON CONFLICT (id)
  DO UPDATE SET email = EXCLUDED.email;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;

CREATE TRIGGER trg_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND auth.uid() = OLD.id
     AND public.auth_user_role() IS DISTINCT FROM 'admin'
     AND (
       NEW.role IS DISTINCT FROM OLD.role
       OR NEW.assigned_shelf_id IS DISTINCT FROM OLD.assigned_shelf_id
     ) THEN
    RAISE EXCEPTION
      'Users cannot change their own role or counter assignment';
  END IF;

  IF auth.uid() IS NOT NULL
     AND auth.uid() <> OLD.id
     AND public.auth_user_role() IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Only admins can update another profile';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation
ON public.profiles;

CREATE TRIGGER trg_prevent_profile_privilege_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- ============================================================
-- 17. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shelves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_events ENABLE ROW LEVEL SECURITY;

-- PROFILES
DROP POLICY IF EXISTS "Profiles viewable by self or admin" ON public.profiles;
DROP POLICY IF EXISTS "Profiles updatable by self (limited) or admin" ON public.profiles;
DROP POLICY IF EXISTS profiles_select_own_profile_fix ON public.profiles;

CREATE POLICY "Profiles viewable by self or admin"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.auth_user_role() = 'admin');

CREATE POLICY profiles_select_own_profile_fix
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Profiles updatable by self (limited) or admin"
ON public.profiles FOR UPDATE
USING (auth.uid() = id OR public.auth_user_role() = 'admin')
WITH CHECK (auth.uid() = id OR public.auth_user_role() = 'admin');

-- APPLICANTS
DROP POLICY IF EXISTS "Applicants viewable by owner or authorized staff" ON public.applicants;
DROP POLICY IF EXISTS "Applicants insertable by owner or token_operator" ON public.applicants;
DROP POLICY IF EXISTS "Applicants updatable by owner or admin" ON public.applicants;

CREATE POLICY "Applicants viewable by owner or authorized staff"
ON public.applicants FOR SELECT
USING (
  account_id = auth.uid()
  OR public.auth_user_role() IN ('admin', 'operation_officer', 'token_operator')
);

CREATE POLICY "Applicants insertable by owner or token_operator"
ON public.applicants FOR INSERT
WITH CHECK (
  account_id = auth.uid()
  OR public.auth_user_role() IN ('admin', 'token_operator')
);

CREATE POLICY "Applicants updatable by owner or admin"
ON public.applicants FOR UPDATE
USING (account_id = auth.uid() OR public.auth_user_role() = 'admin')
WITH CHECK (account_id = auth.uid() OR public.auth_user_role() = 'admin');

-- FLOORS
DROP POLICY IF EXISTS "Floors viewable by all" ON public.floors;
DROP POLICY IF EXISTS "Floors managed by admin" ON public.floors;

CREATE POLICY "Floors viewable by all"
ON public.floors FOR SELECT USING (TRUE);

CREATE POLICY "Floors managed by admin"
ON public.floors FOR ALL
USING (public.auth_user_role() = 'admin')
WITH CHECK (public.auth_user_role() = 'admin');

-- SERVICES
DROP POLICY IF EXISTS "Services viewable by all" ON public.services;
DROP POLICY IF EXISTS "Services managed by admin" ON public.services;

CREATE POLICY "Services viewable by all"
ON public.services FOR SELECT USING (TRUE);

CREATE POLICY "Services managed by admin"
ON public.services FOR ALL
USING (public.auth_user_role() = 'admin')
WITH CHECK (public.auth_user_role() = 'admin');

-- SHELVES
DROP POLICY IF EXISTS "Shelves viewable by all" ON public.shelves;
DROP POLICY IF EXISTS "Shelves managed by admin" ON public.shelves;

CREATE POLICY "Shelves viewable by all"
ON public.shelves FOR SELECT USING (TRUE);

CREATE POLICY "Shelves managed by admin"
ON public.shelves FOR ALL
USING (public.auth_user_role() = 'admin')
WITH CHECK (public.auth_user_role() = 'admin');

-- TOKENS
DROP POLICY IF EXISTS "Tokens viewable by owner or staff" ON public.tokens;
DROP POLICY IF EXISTS "Tokens insertable by authenticated users and operators" ON public.tokens;
DROP POLICY IF EXISTS "Tokens updatable by officers and admins" ON public.tokens;

CREATE POLICY "Tokens viewable by owner or staff"
ON public.tokens FOR SELECT
USING (
  account_id = auth.uid()
  OR public.auth_user_role() IN ('admin', 'operation_officer', 'token_operator')
);

CREATE POLICY "Tokens insertable by authenticated users and operators"
ON public.tokens FOR INSERT
WITH CHECK (
  (auth.uid() = account_id AND public.auth_user_role() = 'user')
  OR public.auth_user_role() IN ('admin', 'token_operator')
);

CREATE POLICY "Tokens updatable by officers and admins"
ON public.tokens FOR UPDATE
USING (
  public.auth_user_role() IN ('admin', 'operation_officer')
  OR (auth.uid() = account_id AND status = 'pending')
)
WITH CHECK (
  public.auth_user_role() IN ('admin', 'operation_officer')
  OR (auth.uid() = account_id AND status IN ('pending', 'cancelled'))
);

-- TOKEN ASSIGNMENTS
DROP POLICY IF EXISTS "Assignments viewable by staff and owner"
ON public.token_assignments;

CREATE POLICY "Assignments viewable by staff and owner"
ON public.token_assignments FOR SELECT
USING (
  public.auth_user_role() IN ('admin', 'operation_officer', 'token_operator')
  OR EXISTS (
    SELECT 1 FROM public.tokens t
    WHERE t.id = token_assignments.token_id
      AND t.account_id = auth.uid()
  )
);

-- TOKEN EVENTS
DROP POLICY IF EXISTS "Events viewable by staff or admin"
ON public.token_events;

CREATE POLICY "Events viewable by staff or admin"
ON public.token_events FOR SELECT
USING (
  public.auth_user_role() IN ('admin', 'operation_officer', 'token_operator')
  OR EXISTS (
    SELECT 1 FROM public.tokens t
    WHERE t.id = token_events.token_id
      AND t.account_id = auth.uid()
  )
);

-- ============================================================
-- 18. FUNCTION PERMISSIONS
-- ============================================================

REVOKE ALL ON FUNCTION public._dispatch_next_token_atomic(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._dispatch_next_token_atomic(UUID) FROM anon, authenticated;

REVOKE ALL ON FUNCTION public.auto_dispatch_pending_tokens() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.auto_dispatch_pending_tokens() FROM anon, authenticated;

REVOKE ALL ON FUNCTION public.dispatch_next_token_atomic(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.dispatch_next_token_atomic(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.dispatch_next_token_atomic(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.handle_officer_token_action(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_officer_token_action(UUID, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.handle_officer_token_action(UUID, TEXT, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.start_token_work(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.start_token_work(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.start_token_work(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.assign_shelf_to_officer(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assign_shelf_to_officer(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.assign_shelf_to_officer(UUID, UUID) TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_public_live_queue() TO anon, authenticated;

-- Token number sequence is used only by the trigger.
REVOKE ALL ON SEQUENCE public.token_number_seq FROM PUBLIC, anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.token_number_seq TO postgres;

-- ============================================================
-- 19. REALTIME PUBLICATION
-- ============================================================

DO $$
DECLARE
  v_table TEXT;
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
    'applicants',
    'floors',
    'profiles',
    'services',
    'shelves',
    'token_assignments',
    'token_events',
    'tokens'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = v_table
    ) THEN
      EXECUTE format(
        'ALTER PUBLICATION supabase_realtime ADD TABLE public.%I',
        v_table
      );
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- 20. FINISH
-- ============================================================

-- No floors, services, shelves, users, applicants or tokens
-- are inserted here. Configure those from the admin dashboard.

SELECT 'Smart Queue database migration completed' AS result;