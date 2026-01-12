DROP VIEW IF EXISTS public.prod_table_view;

CREATE OR REPLACE VIEW public.prod_table_view AS
SELECT
    j.id,
    j.job_number,
    j.sales_order_id,
    ps.rush,
    ps.received_date,
    ps.placement_date,
    ps.ship_schedule,
    ps.ship_status,
    ps.prod_id,
    ps.in_plant_actual,
    ps.in_plant_cabinets_actual,
    ps.doors_completed_actual,
    ps.cut_finish_completed_actual,
    ps.custom_finish_completed_actual,
    ps.drawer_completed_actual,
    ps.cut_melamine_completed_actual,
    ps.paint_completed_actual,
    ps.assembly_completed_actual,
    ps.panel_completed_actual,
    ps.canopy_completed_actual,
    ps.woodtop_completed_actual,
    ps.cust_fin_parts_cut_completed_actual,
    ps.cust_fin_assembled_completed_actual,
    ps.paint_doors_completed_actual,
    ps.paint_canopy_completed_actual,
    ps.paint_cust_cab_completed_actual,

    so.created_at,
    so.shipping_client_name,
    so.is_canopy_required,
    so.is_woodtop_required,
    so.is_custom_cab_required,

    concat_ws(', ', so.shipping_street, so.shipping_city, so.shipping_province, so.shipping_zip) AS site_address,
    cab.box as cabinet_box,
    s."Species" as cabinet_species,
    c."Name" as cabinet_color,
    ds.name as cabinet_door_style,
    i.has_shipped
FROM public.jobs j
JOIN public.production_schedule ps ON j.prod_id = ps.prod_id
LEFT JOIN public.sales_orders so ON j.sales_order_id = so.id
LEFT JOIN public.cabinets cab ON so.cabinet_id = cab.id
LEFT JOIN public.species s ON cab.species_id = s."Id"
LEFT JOIN public.colors c ON cab.color_id = c."Id"
LEFT JOIN public.door_styles ds ON cab.door_style_id = ds.id
LEFT JOIN public.installation i ON j.installation_id = i.installation_id
WHERE
  j.is_active = true;