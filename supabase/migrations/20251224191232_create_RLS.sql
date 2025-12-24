-- Enable RLS on all tables
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cabinets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backorders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homeowners_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.door_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.species ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow INSERT for Admins and Designers on Client" ON public.client;
DROP POLICY IF EXISTS "Allow INSERT for Admins and Designers on Jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow INSERT for Admins and Designers on Sales Orders" ON public.sales_orders;
DROP POLICY IF EXISTS "Allow SELECT for Admins and Designers on Client" ON public.client;
DROP POLICY IF EXISTS "Allow SELECT for Admins and Designers on Jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow SELECT for Admins and Designers on Sales Orders" ON public.sales_orders;
DROP POLICY IF EXISTS "Allow UPDATE for Admins and Designers on Cabinets" ON public.cabinets;
DROP POLICY IF EXISTS "Allow UPDATE for Admins and Designers on Client" ON public.client;
DROP POLICY IF EXISTS "Allow UPDATE for Admins and Designers on Jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow UPDATE for Admins and Designers on Sales Orders" ON public.sales_orders;

CREATE POLICY "Enable read access for authenticated users"
ON public.jobs FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users"
ON public.sales_orders FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users"
ON public.client FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users"
ON public.cabinets FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users"
ON public.production_schedule FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users"
ON public.installation FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users"
ON public.installers FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users"
ON public.service_orders FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users"
ON public.service_order_parts FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users"
ON public.invoices FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users"
ON public.backorders FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users"
ON public.purchase_tracking FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users"
ON public.purchase_order_items FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users"
ON public.job_attachments FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users"
ON public.homeowners_info FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users"
ON public.door_styles FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users"
ON public.colors FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users"
ON public.species FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for admin only" ON public.jobs FOR DELETE USING (public.clerk_user_role() = 'admin');
CREATE POLICY "Enable delete for admin only" ON public.sales_orders FOR DELETE USING (public.clerk_user_role() = 'admin');
CREATE POLICY "Enable delete for admin only" ON public.client FOR DELETE USING (public.clerk_user_role() = 'admin');
CREATE POLICY "Enable delete for admin only" ON public.cabinets FOR DELETE USING (public.clerk_user_role() = 'admin');
CREATE POLICY "Enable delete for admin only" ON public.production_schedule FOR DELETE USING (public.clerk_user_role() = 'admin');
CREATE POLICY "Enable delete for admin only" ON public.installation FOR DELETE USING (public.clerk_user_role() = 'admin');
CREATE POLICY "Enable delete for admin only" ON public.installers FOR DELETE USING (public.clerk_user_role() = 'admin');
CREATE POLICY "Enable delete for admin only" ON public.service_orders FOR DELETE USING (public.clerk_user_role() = 'admin');
CREATE POLICY "Enable delete for admin only" ON public.service_order_parts FOR DELETE USING (public.clerk_user_role() = 'admin');
CREATE POLICY "Enable delete for admin only" ON public.invoices FOR DELETE USING (public.clerk_user_role() = 'admin');
CREATE POLICY "Enable delete for admin only" ON public.backorders FOR DELETE USING (public.clerk_user_role() = 'admin');
CREATE POLICY "Enable delete for admin only" ON public.purchase_tracking FOR DELETE USING (public.clerk_user_role() = 'admin');
CREATE POLICY "Enable delete for admin only" ON public.purchase_order_items FOR DELETE USING (public.clerk_user_role() = 'admin');
CREATE POLICY "Enable delete for admin only" ON public.job_attachments FOR DELETE USING (public.clerk_user_role() = 'admin');
CREATE POLICY "Enable delete for admin only" ON public.homeowners_info FOR DELETE USING (public.clerk_user_role() = 'admin');
CREATE POLICY "Enable delete for admin only" ON public.door_styles FOR DELETE USING (public.clerk_user_role() = 'admin');
CREATE POLICY "Enable delete for admin only" ON public.colors FOR DELETE USING (public.clerk_user_role() = 'admin');
CREATE POLICY "Enable delete for admin only" ON public.species FOR DELETE USING (public.clerk_user_role() = 'admin');


CREATE POLICY "Enable insert for client editors" ON public.client FOR INSERT
WITH CHECK (public.clerk_user_role() IN ('admin', 'designer', 'scheduler', 'installation', 'service', 'reception'));

CREATE POLICY "Enable update for client editors" ON public.client FOR UPDATE
USING (public.clerk_user_role() IN ('admin', 'designer', 'scheduler', 'installation', 'service', 'reception'));

CREATE POLICY "Enable insert for sales editors" ON public.jobs FOR INSERT
WITH CHECK (public.clerk_user_role() IN ('admin', 'designer', 'scheduler'));
CREATE POLICY "Enable update for sales editors" ON public.jobs FOR UPDATE
USING (public.clerk_user_role() IN ('admin', 'designer', 'scheduler'));

CREATE POLICY "Enable insert for sales editors" ON public.sales_orders FOR INSERT
WITH CHECK (public.clerk_user_role() IN ('admin', 'designer', 'scheduler'));
CREATE POLICY "Enable update for sales editors" ON public.sales_orders FOR UPDATE
USING (public.clerk_user_role() IN ('admin', 'designer', 'scheduler'));

CREATE POLICY "Enable insert for sales editors" ON public.cabinets FOR INSERT
WITH CHECK (public.clerk_user_role() IN ('admin', 'designer', 'scheduler'));
CREATE POLICY "Enable update for sales editors" ON public.cabinets FOR UPDATE
USING (public.clerk_user_role() IN ('admin', 'designer', 'scheduler'));

CREATE POLICY "Enable insert for sales editors" ON public.homeowners_info FOR INSERT
WITH CHECK (public.clerk_user_role() IN ('admin', 'designer', 'scheduler'));
CREATE POLICY "Enable update for sales editors" ON public.homeowners_info FOR UPDATE
USING (public.clerk_user_role() IN ('admin', 'designer', 'scheduler'));

CREATE POLICY "Enable insert for sales editors" ON public.job_attachments FOR INSERT
WITH CHECK (public.clerk_user_role() IN ('admin', 'designer', 'scheduler'));
CREATE POLICY "Enable update for sales editors" ON public.job_attachments FOR UPDATE
USING (public.clerk_user_role() IN ('admin', 'designer', 'scheduler'));

CREATE POLICY "Enable insert for production editors" ON public.production_schedule FOR INSERT
WITH CHECK (public.clerk_user_role() IN ('admin', 'scheduler', 'installation', 'service', 'plant'));

CREATE POLICY "Enable update for production editors" ON public.production_schedule FOR UPDATE
USING (public.clerk_user_role() IN ('admin', 'scheduler', 'installation', 'service', 'plant'));

CREATE POLICY "Enable insert for installation editors" ON public.installation FOR INSERT
WITH CHECK (public.clerk_user_role() IN ('admin', 'installation', 'service', 'inspection', 'plant'));

CREATE POLICY "Enable update for installation editors" ON public.installation FOR UPDATE
USING (public.clerk_user_role() IN ('admin', 'installation', 'service', 'inspection', 'plant'));


CREATE POLICY "Enable insert for service editors" ON public.service_orders FOR INSERT
WITH CHECK (public.clerk_user_role() IN ('admin', 'installation', 'service'));
CREATE POLICY "Enable update for service editors" ON public.service_orders FOR UPDATE
USING (public.clerk_user_role() IN ('admin', 'installation', 'service'));

CREATE POLICY "Enable insert for service editors" ON public.service_order_parts FOR INSERT
WITH CHECK (public.clerk_user_role() IN ('admin', 'installation', 'service'));
CREATE POLICY "Enable update for service editors" ON public.service_order_parts FOR UPDATE
USING (public.clerk_user_role() IN ('admin', 'installation', 'service'));

CREATE POLICY "Enable insert for installers" ON public.installers FOR INSERT
WITH CHECK (public.clerk_user_role() IN ('admin', 'installation', 'service'));
CREATE POLICY "Enable update for installers" ON public.installers FOR UPDATE
USING (public.clerk_user_role() IN ('admin', 'installation', 'service'));


CREATE POLICY "Enable insert for invoice editors" ON public.invoices FOR INSERT
WITH CHECK (public.clerk_user_role() IN ('admin', 'reception', 'service'));
CREATE POLICY "Enable update for invoice editors" ON public.invoices FOR UPDATE
USING (public.clerk_user_role() IN ('admin', 'reception', 'service'));


CREATE POLICY "Enable insert for purchasing editors" ON public.purchase_tracking FOR INSERT
WITH CHECK (public.clerk_user_role() IN ('admin', 'scheduler'));
CREATE POLICY "Enable update for purchasing editors" ON public.purchase_tracking FOR UPDATE
USING (public.clerk_user_role() IN ('admin', 'scheduler'));

CREATE POLICY "Enable insert for purchasing editors" ON public.purchase_order_items FOR INSERT
WITH CHECK (public.clerk_user_role() IN ('admin', 'scheduler'));
CREATE POLICY "Enable update for purchasing editors" ON public.purchase_order_items FOR UPDATE
USING (public.clerk_user_role() IN ('admin', 'scheduler'));

CREATE POLICY "Enable insert for backorder editors" ON public.backorders FOR INSERT
WITH CHECK (public.clerk_user_role() IN ('admin', 'scheduler', 'installation', 'service'));
CREATE POLICY "Enable update for backorder editors" ON public.backorders FOR UPDATE
USING (public.clerk_user_role() IN ('admin', 'scheduler', 'installation', 'service'));

CREATE POLICY "Enable insert for admin only" ON public.door_styles FOR INSERT
WITH CHECK (public.clerk_user_role() = 'admin');
CREATE POLICY "Enable update for admin only" ON public.door_styles FOR UPDATE
USING (public.clerk_user_role() = 'admin');

CREATE POLICY "Enable insert for admin only" ON public.colors FOR INSERT
WITH CHECK (public.clerk_user_role() = 'admin');
CREATE POLICY "Enable update for admin only" ON public.colors FOR UPDATE
USING (public.clerk_user_role() = 'admin');

CREATE POLICY "Enable insert for admin only" ON public.species FOR INSERT
WITH CHECK (public.clerk_user_role() = 'admin');
CREATE POLICY "Enable update for admin only" ON public.species FOR UPDATE
USING (public.clerk_user_role() = 'admin');