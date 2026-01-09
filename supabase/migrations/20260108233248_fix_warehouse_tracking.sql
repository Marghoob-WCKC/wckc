ALTER TABLE public.warehouse_tracking
ADD CONSTRAINT warehouse_tracking_job_id_key UNIQUE (job_id);