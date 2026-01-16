ALTER TABLE "public"."invoices"
ADD COLUMN "service_order_id" bigint REFERENCES "public"."service_orders" ("service_order_id");