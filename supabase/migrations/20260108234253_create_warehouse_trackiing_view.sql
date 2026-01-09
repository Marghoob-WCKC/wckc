create or replace view warehouse_tracking_view as
select
  wt.id,
  wt.job_id,
  j.job_number,
  so.shipping_client_name,
  concat_ws(', ', so.shipping_street, so.shipping_city, so.shipping_province, so.shipping_zip) as shipping_address,
  c.box,
  wt.dropoff_date,
  wt.pickup_date,
  wt.pallets,
  wt.notes
from warehouse_tracking wt
left join jobs j on wt.job_id = j.id
left join sales_orders so on j.sales_order_id = so.id
left join cabinets c on so.cabinet_id = c.id;