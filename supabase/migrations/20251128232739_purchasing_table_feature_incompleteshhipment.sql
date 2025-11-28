ALTER TABLE "public"."purchase_tracking"
ADD COLUMN "doors_received_incomplete_at" timestamp with time zone,
ADD COLUMN "glass_received_incomplete_at" timestamp with time zone,
ADD COLUMN "handles_received_incomplete_at" timestamp with time zone,
ADD COLUMN "acc_received_incomplete_at" timestamp with time zone;