
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  t text;

  tables text[] := array[
    'backorders',
    'cabinets',
    'client',
    'colors',
    'door_styles',
    'homeowners_info',
    'installation',
    'installers',
    'invoices',
    'job_attachments',
    'jobs',
    'production_schedule',
    'purchase_order_items',
    'purchase_tracking',
    'sales_orders',
    'service_order_parts',
    'service_orders',
    'site_visits',
    'species',
    'warehouse_tracking'
  ];
begin
  foreach t in array tables
  loop

    execute format('
      alter table public.%I
      add column if not exists updated_at timestamp with time zone default now() not null;
    ', t);


    execute format('drop trigger if exists set_updated_at on public.%I;', t);


    if t = 'client' then
        execute 'drop trigger if exists on_client_updated on public.client;';
    end if;

    if t = 'production_schedule' then
        execute 'drop trigger if exists set_production_schedule_updated_at on public.production_schedule;';
    end if;

    execute format('
      create trigger set_updated_at
      before update on public.%I
      for each row
      execute function public.handle_updated_at();
    ', t);
    
    raise notice 'Standardized updated_at for table: %', t;
  end loop;
end;
$$;