-- 1. Remove Triggers from all tables
DROP TRIGGER IF EXISTS trg_audit_production_schedule ON public.production_schedule;
DROP TRIGGER IF EXISTS trg_audit_jobs ON public.jobs;
DROP TRIGGER IF EXISTS trg_audit_sales_orders ON public.sales_orders;
DROP TRIGGER IF EXISTS trg_audit_installation ON public.installation;
DROP TRIGGER IF EXISTS trg_audit_purchasing ON public.purchase_tracking;
DROP TRIGGER IF EXISTS trg_audit_service_orders ON public.service_orders;
DROP TRIGGER IF EXISTS trg_audit_invoices ON public.invoices;

-- 2. Drop the Trigger Function
DROP FUNCTION IF EXISTS public.trigger_audit_log();

-- 3. Drop the Audit Logs Table (Cascades to policies and data)
DROP TABLE IF EXISTS public.audit_logs;