create or replace function revert_job_to_quote(p_sales_order_id int)
returns void
language plpgsql
security definer
as $$
declare
    current_stage text;
begin
    select stage into current_stage 
    from public.sales_orders 
    where id = p_sales_order_id;
    if current_stage = 'SOLD' then
        delete from public.production_schedule
        where prod_id in (
            select prod_id from public.jobs where sales_order_id = p_sales_order_id
        );

        delete from public.installation
        where installation_id in (
            select installation_id from public.jobs where sales_order_id = p_sales_order_id
        );

        delete from public.jobs
        where sales_order_id = p_sales_order_id;

        update public.sales_orders
        set stage = 'QUOTE',
            date_sold = null
        where id = p_sales_order_id;
    end if;
end;
$$;