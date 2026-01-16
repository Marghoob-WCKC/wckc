CREATE INDEX IF NOT EXISTS idx_jobs_sales_order_id ON jobs (sales_order_id);

CREATE INDEX IF NOT EXISTS idx_jobs_prod_id ON jobs (prod_id);

CREATE INDEX IF NOT EXISTS idx_jobs_installation_id ON jobs (installation_id);

CREATE INDEX IF NOT EXISTS idx_service_orders_job_id ON service_orders (job_id);