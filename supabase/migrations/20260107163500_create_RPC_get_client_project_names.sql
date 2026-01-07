create or replace function get_client_project_names(input_client_id bigint)
returns table (project_name text)
language sql
as $$
  select distinct project_name
  from sales_orders
  where client_id = input_client_id
  and project_name is not null
  and trim(project_name) <> ''
  order by project_name;
$$;