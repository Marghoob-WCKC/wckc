DROP VIEW public.shipped_not_invoiced_view;
CREATE OR REPLACE VIEW public.shipped_not_invoiced_view AS
SELECT
    j.id,
    j.job_number,
    ps.ship_schedule as ship_date,
    s.shipping_client_name,
    CONCAT_WS(', ', 
        NULLIF(s.shipping_street, ''), 
        NULLIF(s.shipping_city, ''), 
        NULLIF(s.shipping_province, ''), 
        NULLIF(s.shipping_zip, '')
    ) as shipping_address
FROM public.jobs j
JOIN public.installation inst ON j.installation_id = inst.installation_id
JOIN public.sales_orders s ON j.sales_order_id = s.id
LEFT JOIN public.production_schedule ps ON j.prod_id = ps.prod_id
LEFT JOIN public.invoices i ON j.id = i.job_id
WHERE
    inst.has_shipped = true
    AND i.invoice_id IS NULL;