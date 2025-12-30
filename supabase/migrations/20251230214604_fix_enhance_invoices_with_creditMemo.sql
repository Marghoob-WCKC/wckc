alter table public.invoices
drop column is_creditmemo,
add column is_creditmemo boolean default false;