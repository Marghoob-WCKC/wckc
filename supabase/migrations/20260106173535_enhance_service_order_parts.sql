CREATE TYPE "so_part_status" AS ENUM ('pending', 'completed');
alter table public.service_order_parts
add column status "so_part_status" default 'pending',
add column location text;