DROP VIEW IF EXISTS public.plant_production_view;

CREATE
OR REPLACE VIEW public.plant_table_view AS
SELECT
  j.id as job_id,
  j.prod_id,
  j.job_number,
  --Client
  so.shipping_client_name as client_name,
  so.project_name,
  c.box as cabinet_box,
  ds.name as cabinet_door_style,
  s."Species" as cabinet_species,
  col."Name" as cabinet_color,
  i.installation_id,
  i.wrap_date,
  i.wrap_completed,
  i.has_shipped,
  i.installation_notes,
  ps.placement_date,
  --Just in Case for Future:
  ps.ship_schedule,
  ps.ship_status,
  --(Plant Tracking)
  --M
  ps.cut_melamine_completed_actual,
  --D
  ps.doors_completed_actual,
  --P
  ps.panel_completed_actual,
  --F/C
  ps.custom_finish_completed_actual,
  --P/S
  ps.paint_completed_actual,
  --Paint Details
  ps.paint_doors_completed_actual,
  ps.paint_canopy_completed_actual,
  ps.paint_cust_cab_completed_actual,
  --A
  ps.assembly_completed_actual,
  --Others
  ps.drawer_completed_actual,
  ps.woodtop_completed_actual,
  ps.canopy_completed_actual,
FROM
  public.jobs j
  LEFT JOIN public.sales_orders so ON j.sales_order_id = so.id
  LEFT JOIN public.cabinets c ON so.cabinet_id = c.id
  LEFT JOIN public.door_styles ds ON c.door_style_id = ds.id
  LEFT JOIN public.species s ON c.species_id = s."Id"
  LEFT JOIN public.colors col ON c.color_id = col."Id"
  JOIN public.installation i ON j.installation_id = i.installation_id
  LEFT JOIN public.production_schedule ps ON j.prod_id = ps.prod_id
WHERE
  j.is_active = true;