alter table public.installation
add column installation_report_received timestamp with time zone,
add column in_warehouse timestamp with time zone;