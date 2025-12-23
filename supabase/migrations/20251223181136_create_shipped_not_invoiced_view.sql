create or replace view shipped_not_invoiced_view as
select
  j.id,
  j.job_number,
  so.shipping_client_name,
  concat_ws(', ', so.shipping_street, so.shipping_city, so.shipping_province, so.shipping_zip ) as shipping_address
from jobs j
join installation i on j.installation_id = i.installation_id
join sales_orders so on j.sales_order_id = so.id
left join invoices inv on j.id = inv.job_id
where i.has_shipped = true
and inv.invoice_id is null;