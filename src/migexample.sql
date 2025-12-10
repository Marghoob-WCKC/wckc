-- Enable RLS on all tables
ALTER TABLE public.backorders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cabinets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.door_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homeowners_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.species ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------
-- 1. GLOBAL READ POLICY (All authenticated staff can view data)
-- -------------------------------------------------------------------------
-- Based on the matrix, nearly every role has read access to other departments.
-- Restricting this too tightly often breaks dashboard overviews.

CREATE POLICY "Enable read access for all authenticated users"
ON public.backorders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for all authenticated users"
ON public.cabinets FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for all authenticated users"
ON public.client FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for all authenticated users"
ON public.colors FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for all authenticated users"
ON public.door_styles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for all authenticated users"
ON public.homeowners_info FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for all authenticated users"
ON public.installation FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for all authenticated users"
ON public.installers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for all authenticated users"
ON public.invoices FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for all authenticated users"
ON public.job_attachments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for all authenticated users"
ON public.jobs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for all authenticated users"
ON public.production_schedule FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for all authenticated users"
ON public.purchase_order_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for all authenticated users"
ON public.purchase_tracking FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for all authenticated users"
ON public.sales_orders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for all authenticated users"
ON public.service_order_parts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for all authenticated users"
ON public.service_orders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for all authenticated users"
ON public.species FOR SELECT TO authenticated USING (true);


-- -------------------------------------------------------------------------
-- 2. WRITE POLICIES (INSERT, UPDATE, DELETE)
-- -------------------------------------------------------------------------

-- A. SALES & JOBS (Admin, Designer, Scheduler)
-- Affects: jobs, sales_orders, cabinets
CREATE POLICY "Sales Write Access"
ON public.jobs
FOR ALL
TO authenticated
USING (lower(public.clerk_user_role()) IN ('admin', 'designer', 'scheduler'))
WITH CHECK (lower(public.clerk_user_role()) IN ('admin', 'designer', 'scheduler'));

CREATE POLICY "Sales Write Access"
ON public.sales_orders
FOR ALL
TO authenticated
USING (lower(public.clerk_user_role()) IN ('admin', 'designer', 'scheduler'))
WITH CHECK (lower(public.clerk_user_role()) IN ('admin', 'designer', 'scheduler'));

CREATE POLICY "Sales Write Access"
ON public.cabinets
FOR ALL
TO authenticated
USING (lower(public.clerk_user_role()) IN ('admin', 'designer', 'scheduler'))
WITH CHECK (lower(public.clerk_user_role()) IN ('admin', 'designer', 'scheduler'));


-- B. CLIENTS (Admin, Designer, Scheduler, Installation, Service, Reception)
-- Note: Installers/Service need write access to update contact info if changed on site
CREATE POLICY "Clients Write Access"
ON public.client
FOR ALL
TO authenticated
USING (lower(public.clerk_user_role()) IN ('admin', 'designer', 'scheduler', 'installation', 'service', 'reception'))
WITH CHECK (lower(public.clerk_user_role()) IN ('admin', 'designer', 'scheduler', 'installation', 'service', 'reception'));


-- C. PRODUCTION (Admin, Scheduler, Plant)
-- Note: 'Plant' is added here to allow updating "Actuals" (doors_completed_actual, etc.)
CREATE POLICY "Production Write Access"
ON public.production_schedule
FOR ALL
TO authenticated
USING (lower(public.clerk_user_role()) IN ('admin', 'scheduler', 'plant'))
WITH CHECK (lower(public.clerk_user_role()) IN ('admin', 'scheduler', 'plant'));


-- D. INSTALLATION (Admin, Installation, Service, Plant)
-- Affects: installation, backorders
CREATE POLICY "Installation Write Access"
ON public.installation
FOR ALL
TO authenticated
USING (lower(public.clerk_user_role()) IN ('admin', 'installation', 'service', 'plant'))
WITH CHECK (lower(public.clerk_user_role()) IN ('admin', 'installation', 'service', 'plant'));

CREATE POLICY "Installation Write Access"
ON public.backorders
FOR ALL
TO authenticated
USING (lower(public.clerk_user_role()) IN ('admin', 'installation', 'service', 'plant'))
WITH CHECK (lower(public.clerk_user_role()) IN ('admin', 'installation', 'service', 'plant'));


-- E. SERVICE ORDERS (Admin, Installation, Service)
-- Affects: service_orders, service_order_parts, homeowners_info
CREATE POLICY "Service Orders Write Access"
ON public.service_orders
FOR ALL
TO authenticated
USING (lower(public.clerk_user_role()) IN ('admin', 'installation', 'service'))
WITH CHECK (lower(public.clerk_user_role()) IN ('admin', 'installation', 'service'));

CREATE POLICY "Service Orders Write Access"
ON public.service_order_parts
FOR ALL
TO authenticated
USING (lower(public.clerk_user_role()) IN ('admin', 'installation', 'service'))
WITH CHECK (lower(public.clerk_user_role()) IN ('admin', 'installation', 'service'));

CREATE POLICY "Service Orders Write Access"
ON public.homeowners_info
FOR ALL
TO authenticated
USING (lower(public.clerk_user_role()) IN ('admin', 'installation', 'service'))
WITH CHECK (lower(public.clerk_user_role()) IN ('admin', 'installation', 'service'));


-- F. PURCHASING (Admin, Scheduler)
-- Affects: purchase_tracking, purchase_order_items
CREATE POLICY "Purchasing Write Access"
ON public.purchase_tracking
FOR ALL
TO authenticated
USING (lower(public.clerk_user_role()) IN ('admin', 'scheduler'))
WITH CHECK (lower(public.clerk_user_role()) IN ('admin', 'scheduler'));

CREATE POLICY "Purchasing Write Access"
ON public.purchase_order_items
FOR ALL
TO authenticated
USING (lower(public.clerk_user_role()) IN ('admin', 'scheduler'))
WITH CHECK (lower(public.clerk_user_role()) IN ('admin', 'scheduler'));


-- G. INVOICES (Admin, Service, Reception)
CREATE POLICY "Invoices Write Access"
ON public.invoices
FOR ALL
TO authenticated
USING (lower(public.clerk_user_role()) IN ('admin', 'service', 'reception'))
WITH CHECK (lower(public.clerk_user_role()) IN ('admin', 'service', 'reception'));


-- H. INSTALLERS (Admin, Installation, Service)
-- Managing the list of installers
CREATE POLICY "Installers List Write Access"
ON public.installers
FOR ALL
TO authenticated
USING (lower(public.clerk_user_role()) IN ('admin', 'installation', 'service'))
WITH CHECK (lower(public.clerk_user_role()) IN ('admin', 'installation', 'service'));


-- I. ATTACHMENTS (Admin, Designer, Scheduler, Installation, Service, Plant)
-- Most roles need to upload photos or docs (Sales docs, Site photos, etc)
CREATE POLICY "Attachments Write Access"
ON public.job_attachments
FOR ALL
TO authenticated
USING (lower(public.clerk_user_role()) IN ('admin', 'designer', 'scheduler', 'installation', 'service', 'plant'))
WITH CHECK (lower(public.clerk_user_role()) IN ('admin', 'designer', 'scheduler', 'installation', 'service', 'plant'));


-- J. LOOKUP TABLES (Admin, Designer, Scheduler)
-- colors, species, door_styles
CREATE POLICY "Lookups Write Access"
ON public.colors
FOR ALL
TO authenticated
USING (lower(public.clerk_user_role()) IN ('admin', 'designer', 'scheduler'))
WITH CHECK (lower(public.clerk_user_role()) IN ('admin', 'designer', 'scheduler'));

CREATE POLICY "Lookups Write Access"
ON public.species
FOR ALL
TO authenticated
USING (lower(public.clerk_user_role()) IN ('admin', 'designer', 'scheduler'))
WITH CHECK (lower(public.clerk_user_role()) IN ('admin', 'designer', 'scheduler'));

CREATE POLICY "Lookups Write Access"
ON public.door_styles
FOR ALL
TO authenticated
USING (lower(public.clerk_user_role()) IN ('admin', 'designer', 'scheduler'))
WITH CHECK (lower(public.clerk_user_role()) IN ('admin', 'designer', 'scheduler'));