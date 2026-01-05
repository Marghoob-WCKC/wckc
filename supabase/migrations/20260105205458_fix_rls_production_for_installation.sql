
DROP POLICY IF EXISTS "Enable insert for installation editors" ON public.installation;
DROP POLICY IF EXISTS "Enable update for installation editors" ON public.installation;


CREATE POLICY "Enable insert for installation editors" ON public.installation FOR INSERT
WITH CHECK (
  public.clerk_user_role() IN ('admin', 'installation', 'service', 'inspection', 'plant', 'scheduler')
);


CREATE POLICY "Enable update for installation editors" ON public.installation FOR UPDATE
USING (
  public.clerk_user_role() IN ('admin', 'installation', 'service', 'inspection', 'plant', 'scheduler')
);