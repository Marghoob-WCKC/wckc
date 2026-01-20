drop view installation_table_view;

create
or replace view installation_table_view as
select
    j.id as job_id,
    j.job_number,
    j.sales_order_id,
    j.prod_id,
    so.created_at,
    so.shipping_client_name,
    so.project_name,
    concat_ws (
        ', ',
        so.shipping_street,
        so.shipping_city,
        so.shipping_province
    ) as site_address,
    so.is_cod,
    NULLIF(c.box, '')::integer as box,
    i.installation_id,
    i.installation_date,
    i.wrap_date,
    i.inspection_date,
    i.has_shipped,
    i.partially_shipped,
    i.installation_completed,
    i.inspection_completed,
    i.installer_id,
    ins.company_name as installer_company,
    ins.first_name as installer_first_name,
    ins.last_name as installer_last_name,
    ps.rush,
    ps.ship_schedule,
    ps.ship_status
from
    jobs j
    join sales_orders so on j.sales_order_id = so.id
    join installation i on j.installation_id = i.installation_id
    left join cabinets c on so.cabinet_id = c.id
    left join installers ins on i.installer_id = ins.installer_id
    left join production_schedule ps on j.prod_id = ps.prod_id
where
    j.is_active = true;