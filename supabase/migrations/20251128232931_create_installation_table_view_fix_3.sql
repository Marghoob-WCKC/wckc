drop view public.purchasing_table_view;
create or replace view public.purchasing_table_view as
select
  pt.purchase_check_id,
  pt.job_id,
  pt.doors_ordered_at,
  pt.doors_received_at,
  pt.doors_received_incomplete_at,
  pt.glass_ordered_at,
  pt.glass_received_at,
  pt.glass_received_incomplete_at,
  pt.handles_ordered_at,
  pt.handles_received_at,
  pt.handles_received_incomplete_at,
  pt.acc_ordered_at,
  pt.acc_received_at,
  pt.acc_received_incomplete_at,
  pt.purchasing_comments,
  j.job_number,
  j.sales_order_id,
  so.shipping_client_name as client_name,
  ps.ship_schedule,
  ds.name as door_style_name,
  ds.is_made_in_house as door_made_in_house
from
  public.purchase_tracking pt
  join public.jobs j on pt.job_id = j.id
  left join public.sales_orders so on j.sales_order_id = so.id
  left join public.cabinets c on so.cabinet_id = c.id
  left join public.door_styles ds on c.door_style_id = ds.id
  left join public.production_schedule ps on j.prod_id = ps.prod_id;