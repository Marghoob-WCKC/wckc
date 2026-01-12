-- 1. Create the Audit Logs Table
DROP TABLE public.audit_logs;
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_name text NOT NULL,
  record_id text NOT NULL,
  operation text NOT NULL,
  performed_by text,              -- Will now store 'user_role' (e.g., 'manager', 'admin')
  changed_fields jsonb,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read logs
CREATE POLICY "Enable read access for authenticated users" ON "public"."audit_logs"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);


CREATE OR REPLACE FUNCTION public.trigger_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_jwt jsonb;
  v_user_text text;
  v_changed_fields jsonb;
  v_record_id text;
BEGIN
  -- A. Get the User Identifier (Robust JSON Extraction)
  -- 1. Get the full claims object safely
  BEGIN
    v_jwt := current_setting('request.jwt.claims', true)::jsonb;
  EXCEPTION WHEN OTHERS THEN
    v_jwt := '{}'::jsonb; -- Fallback if no JWT present
  END;

  -- 2. Extract fields from the JSON
  v_user_text := coalesce(
    nullif(v_jwt ->> 'user_role', ''),  -- Matches {{user.public_metadata.role}}
    nullif(v_jwt ->> 'user_id', ''),    -- Matches {{user.id}}
    nullif(v_jwt ->> 'sub', ''),        -- Standard Fallback
    'system'
  );

  -- B. Determine Record ID based on Table Name
  IF TG_TABLE_NAME = 'production_schedule' THEN
    v_record_id := COALESCE(NEW.prod_id, OLD.prod_id)::text;
  
  ELSIF TG_TABLE_NAME = 'installation' THEN
    v_record_id := COALESCE(NEW.installation_id, OLD.installation_id)::text;
    
  ELSIF TG_TABLE_NAME = 'installers' THEN
    v_record_id := COALESCE(NEW.installer_id, OLD.installer_id)::text;
    
  ELSIF TG_TABLE_NAME = 'service_orders' THEN
    v_record_id := COALESCE(NEW.service_order_id, OLD.service_order_id)::text;
    
  ELSIF TG_TABLE_NAME = 'invoices' THEN
    v_record_id := COALESCE(NEW.invoice_id, OLD.invoice_id)::text;
    
  ELSIF TG_TABLE_NAME = 'purchase_tracking' THEN
    v_record_id := COALESCE(NEW.purchase_check_id, OLD.purchase_check_id)::text;

  ELSE
    v_record_id := COALESCE(NEW.id, OLD.id)::text;
  END IF;

  -- C. Handle INSERT
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.audit_logs (table_name, record_id, operation, performed_by, new_data)
    VALUES (TG_TABLE_NAME, v_record_id, 'INSERT', v_user_text, to_jsonb(NEW));
    RETURN NEW;

  -- D. Handle UPDATE
  ELSIF (TG_OP = 'UPDATE') THEN
    SELECT jsonb_object_agg(key, value) INTO v_changed_fields
    FROM jsonb_each(to_jsonb(NEW))
    WHERE to_jsonb(OLD) -> key IS DISTINCT FROM value;

    IF v_changed_fields IS NOT NULL THEN
       INSERT INTO public.audit_logs (table_name, record_id, operation, performed_by, changed_fields)
       VALUES (TG_TABLE_NAME, v_record_id, 'UPDATE', v_user_text, v_changed_fields);
    END IF;
    RETURN NEW;

  -- E. Handle DELETE
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO public.audit_logs (table_name, record_id, operation, performed_by, old_data)
    VALUES (TG_TABLE_NAME, v_record_id, 'DELETE', v_user_text, to_jsonb(OLD));
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

-- 3. Apply Triggers to Key Tables

DROP TRIGGER IF EXISTS trg_audit_production_schedule ON public.production_schedule;
CREATE TRIGGER trg_audit_production_schedule
AFTER INSERT OR UPDATE OR DELETE ON public.production_schedule
FOR EACH ROW EXECUTE FUNCTION public.trigger_audit_log();

DROP TRIGGER IF EXISTS trg_audit_jobs ON public.jobs;
CREATE TRIGGER trg_audit_jobs
AFTER INSERT OR UPDATE OR DELETE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.trigger_audit_log();

DROP TRIGGER IF EXISTS trg_audit_sales_orders ON public.sales_orders;
CREATE TRIGGER trg_audit_sales_orders
AFTER INSERT OR UPDATE OR DELETE ON public.sales_orders
FOR EACH ROW EXECUTE FUNCTION public.trigger_audit_log();

DROP TRIGGER IF EXISTS trg_audit_installation ON public.installation;
CREATE TRIGGER trg_audit_installation
AFTER INSERT OR UPDATE OR DELETE ON public.installation
FOR EACH ROW EXECUTE FUNCTION public.trigger_audit_log();

DROP TRIGGER IF EXISTS trg_audit_purchasing ON public.purchase_tracking;
CREATE TRIGGER trg_audit_purchasing
AFTER INSERT OR UPDATE OR DELETE ON public.purchase_tracking
FOR EACH ROW EXECUTE FUNCTION public.trigger_audit_log();

DROP TRIGGER IF EXISTS trg_audit_service_orders ON public.service_orders;
CREATE TRIGGER trg_audit_service_orders
AFTER INSERT OR UPDATE OR DELETE ON public.service_orders
FOR EACH ROW EXECUTE FUNCTION public.trigger_audit_log();

DROP TRIGGER IF EXISTS trg_audit_invoices ON public.invoices;
CREATE TRIGGER trg_audit_invoices
AFTER INSERT OR UPDATE OR DELETE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.trigger_audit_log();