-- 1. Create the Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_name text NOT NULL,
  record_id text NOT NULL,        -- Stores either 'id' or 'prod_id'
  operation text NOT NULL,        -- 'INSERT', 'UPDATE', 'DELETE'
  performed_by text,              -- Clerk User ID or 'system'
  changed_fields jsonb,           -- ONLY stores the fields that changed (for Updates)
  old_data jsonb,                 -- Full backup (only for Deletes)
  new_data jsonb,                 -- Full backup (only for Inserts)
  created_at timestamptz DEFAULT now()
);

-- Enable RLS (Best practice: explicit policies required for access)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Optional: Allow authenticated users (or admins) to read logs
-- Adjust this policy based on your specific Role-Based Access Control requirements
CREATE POLICY "Enable read access for authenticated users" ON "public"."audit_logs"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);


-- 2. Create the Optimized Trigger Function
CREATE OR REPLACE FUNCTION public.trigger_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id text;
  v_changed_fields jsonb;
  v_record_id text;
BEGIN
  -- A. Get the User ID from the Supabase/Clerk JWT
  -- Falls back to 'system' if the change was done via server-side code/cron
  v_user_id := coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    'system'
  );

  -- B. Determine Record ID (Handling specific Primary Keys like prod_id)
  IF TG_TABLE_NAME = 'production_schedule' THEN
    v_record_id := COALESCE(NEW.prod_id, OLD.prod_id)::text;
  ELSE
    v_record_id := COALESCE(NEW.id, OLD.id)::text;
  END IF;

  -- C. Handle INSERT: Log the full new record
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.audit_logs (table_name, record_id, operation, performed_by, new_data)
    VALUES (TG_TABLE_NAME, v_record_id, 'INSERT', v_user_id, to_jsonb(NEW));
    RETURN NEW;

  -- D. Handle UPDATE: Log ONLY the changed fields (Lightweight)
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Calculate the "delta" (what changed)
    SELECT jsonb_object_agg(key, value) INTO v_changed_fields
    FROM jsonb_each(to_jsonb(NEW))
    WHERE to_jsonb(OLD) -> key IS DISTINCT FROM value;

    -- Only insert a log if something actually changed
    IF v_changed_fields IS NOT NULL THEN
       INSERT INTO public.audit_logs (table_name, record_id, operation, performed_by, changed_fields)
       VALUES (TG_TABLE_NAME, v_record_id, 'UPDATE', v_user_id, v_changed_fields);
    END IF;
    RETURN NEW;

  -- E. Handle DELETE: Log the full old record (Recovery)
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO public.audit_logs (table_name, record_id, operation, performed_by, old_data)
    VALUES (TG_TABLE_NAME, v_record_id, 'DELETE', v_user_id, to_jsonb(OLD));
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;


-- 3. Apply Triggers to Key Tables
-- These triggers execute the function above on every change

-- A. Production Schedule
DROP TRIGGER IF EXISTS trg_audit_production_schedule ON public.production_schedule;
CREATE TRIGGER trg_audit_production_schedule
AFTER INSERT OR UPDATE OR DELETE ON public.production_schedule
FOR EACH ROW EXECUTE FUNCTION public.trigger_audit_log();

-- B. Jobs
DROP TRIGGER IF EXISTS trg_audit_jobs ON public.jobs;
CREATE TRIGGER trg_audit_jobs
AFTER INSERT OR UPDATE OR DELETE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.trigger_audit_log();

-- C. Sales Orders
DROP TRIGGER IF EXISTS trg_audit_sales_orders ON public.sales_orders;
CREATE TRIGGER trg_audit_sales_orders
AFTER INSERT OR UPDATE OR DELETE ON public.sales_orders
FOR EACH ROW EXECUTE FUNCTION public.trigger_audit_log();

-- D. Installation
DROP TRIGGER IF EXISTS trg_audit_installation ON public.installation;
CREATE TRIGGER trg_audit_installation
AFTER INSERT OR UPDATE OR DELETE ON public.installation
FOR EACH ROW EXECUTE FUNCTION public.trigger_audit_log();

DROP TRIGGER IF EXISTS trg_audit_purchasing ON public.purchase_tracking;
CREATE TRIGGER trg_audit_purchasing
AFTER INSERT OR UPDATE OR DELETE ON public.purchase_tracking
FOR EACH ROW EXECUTE FUNCTION public.trigger_audit_log();