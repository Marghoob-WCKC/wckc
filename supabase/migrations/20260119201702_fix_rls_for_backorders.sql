
ALTER POLICY "Enable insert for backorder editors"
ON "public"."backorders"
WITH CHECK (
  clerk_user_role() = ANY (ARRAY['admin'::text, 'scheduler'::text, 'installation'::text, 'service'::text, 'plant'::text])
);

ALTER POLICY "Enable update for backorder editors"
ON "public"."backorders"
USING (
  clerk_user_role() = ANY (ARRAY['admin'::text, 'scheduler'::text, 'installation'::text, 'service'::text, 'plant'::text])
)
WITH CHECK (
  clerk_user_role() = ANY (ARRAY['admin'::text, 'scheduler'::text, 'installation'::text, 'service'::text, 'plant'::text])
);