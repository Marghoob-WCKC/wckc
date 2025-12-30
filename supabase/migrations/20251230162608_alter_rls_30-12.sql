
DROP POLICY IF EXISTS "Enable delete for admin only" ON public.service_orders;
DROP POLICY IF EXISTS "Enable delete for admin and service" ON public.service_orders;


CREATE POLICY "Enable delete for admin and service" 
ON public.service_orders FOR DELETE 
USING (public.clerk_user_role() IN ('admin', 'service'));




DROP POLICY IF EXISTS "Enable delete for admin only" ON public.service_order_parts;
DROP POLICY IF EXISTS "Enable delete for admin and service" ON public.service_order_parts;

CREATE POLICY "Enable delete for admin and service" 
ON public.service_order_parts FOR DELETE 
USING (public.clerk_user_role() IN ('admin', 'service'));

DROP POLICY IF EXISTS "Enable insert for sales editors" ON public.homeowners_info;
DROP POLICY IF EXISTS "Enable update for sales editors" ON public.homeowners_info;
DROP POLICY IF EXISTS "Enable delete for admin only" ON public.homeowners_info;

CREATE POLICY "Enable insert for service editors" 
ON public.homeowners_info FOR INSERT
WITH CHECK (public.clerk_user_role() IN ('admin', 'installation', 'service'));


CREATE POLICY "Enable update for service editors" 
ON public.homeowners_info FOR UPDATE
USING (public.clerk_user_role() IN ('admin', 'installation', 'service'));


CREATE POLICY "Enable delete for admin and service" 
ON public.homeowners_info FOR DELETE 
USING (public.clerk_user_role() IN ('admin', 'service'));





DROP POLICY IF EXISTS "Enable insert for sales editors" ON public.job_attachments;
DROP POLICY IF EXISTS "Enable update for sales editors" ON public.job_attachments;


CREATE POLICY "Enable insert for all roles" 
ON public.job_attachments 
FOR INSERT
WITH CHECK (
  public.clerk_user_role() IN (
    'admin', 
    'designer', 
    'scheduler', 
    'installation', 
    'service', 
    'reception', 
    'plant', 
    'inspection'
  )
);

CREATE POLICY "Enable update for all roles" 
ON public.job_attachments 
FOR UPDATE
USING (
  public.clerk_user_role() IN (
    'admin', 
    'designer', 
    'scheduler', 
    'installation', 
    'service', 
    'reception', 
    'plant', 
    'inspection'
  )
);

DROP POLICY IF EXISTS "Enable insert for admin only" ON public.door_styles;
DROP POLICY IF EXISTS "Enable update for admin only" ON public.door_styles;

CREATE POLICY "Enable insert for sales editors" 
ON public.door_styles FOR INSERT
WITH CHECK (public.clerk_user_role() IN ('admin', 'designer', 'scheduler'));

CREATE POLICY "Enable update for sales editors" 
ON public.door_styles FOR UPDATE
USING (public.clerk_user_role() IN ('admin', 'designer', 'scheduler'));


DROP POLICY IF EXISTS "Enable insert for admin only" ON public.colors;
DROP POLICY IF EXISTS "Enable update for admin only" ON public.colors;

CREATE POLICY "Enable insert for sales editors" 
ON public.colors FOR INSERT
WITH CHECK (public.clerk_user_role() IN ('admin', 'designer', 'scheduler'));

CREATE POLICY "Enable update for sales editors" 
ON public.colors FOR UPDATE
USING (public.clerk_user_role() IN ('admin', 'designer', 'scheduler'));

DROP POLICY IF EXISTS "Enable insert for admin only" ON public.species;
DROP POLICY IF EXISTS "Enable update for admin only" ON public.species;

CREATE POLICY "Enable insert for sales editors" 
ON public.species FOR INSERT
WITH CHECK (public.clerk_user_role() IN ('admin', 'designer', 'scheduler'));

CREATE POLICY "Enable update for sales editors" 
ON public.species FOR UPDATE
USING (public.clerk_user_role() IN ('admin', 'designer', 'scheduler'));