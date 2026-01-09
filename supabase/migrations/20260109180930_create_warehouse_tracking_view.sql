create or replace view warehouse_tracking_view as
select

  min(wt.id) as id,

  min(wt.job_id) as job_id,

  j.job_base_number as job_number,

  max(so.shipping_client_name) as shipping_client_name,
  max(concat_ws(', ', so.shipping_street, so.shipping_city, so.shipping_province, so.shipping_zip)) as shipping_address,
  max(c.box) as box,
  wt.dropoff_date,
  wt.pickup_date,
  wt.pallets,
  max(wt.notes) as notes
from warehouse_tracking wt
left join jobs j on wt.job_id = j.id
left join sales_orders so on j.sales_order_id = so.id
left join cabinets c on so.cabinet_id = c.id
group by
  j.job_base_number,
  wt.dropoff_date,
  wt.pickup_date,
  wt.pallets;