UPDATE "public"."service_order_parts" sop
SET "status" = CASE 
    WHEN so."completed_at" IS NOT NULL THEN 'completed'::"public"."so_part_status"
    ELSE 'unknown'::"public"."so_part_status"
END
FROM "public"."service_orders" so
WHERE sop."service_order_id" = so."service_order_id";