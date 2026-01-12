alter table production_schedule
add column canopy_completed_actual timestamptz,
add column woodtop_completed_actual timestamptz,
add column cust_fin_parts_cut_completed_actual timestamptz,
add column cust_fin_assembled_completed_actual timestamptz,
add column paint_doors_completed_actual timestamptz,
add column paint_canopy_completed_actual timestamptz,
add column paint_cust_cab_completed_actual timestamptz;

alter table sales_orders
add column is_canopy_required boolean,
add column is_woodtop_required boolean,
add column is_custom_cab_required boolean;


