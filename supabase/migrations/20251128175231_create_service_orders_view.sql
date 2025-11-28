create or replace view service_orders_table_view as
select
  so.service_order_id,
  so.service_order_number,
  so.date_entered,
  so.due_date,
  so.completed_at,
  j.job_number,
  s.shipping_client_name as client_name,
  concat_ws(', ', s.shipping_street, s.shipping_city, s.shipping_province) as site_address,
  i.company_name as installer_company,
  i.first_name as installer_first,
  i.last_name as installer_last
from
  service_orders so
  left join jobs j on so.job_id = j.id
  left join sales_orders s on j.sales_order_id = s.id
  left join installers i on so.installer_id = i.installer_id;