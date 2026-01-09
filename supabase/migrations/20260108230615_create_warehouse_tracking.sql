create table public.warehouse_tracking (
 id bigint primary key generated always as identity,
job_id bigint references public.jobs(id) on delete set null,
dropoff_date date,
pickup_date date,
pallets integer,
notes text,
created_at timestamptz not null default now());

alter table public.warehouse_tracking enable row level security;

create policy "Enable all access for authenticated users"
on public.warehouse_tracking
for all
to authenticated
using (true);
