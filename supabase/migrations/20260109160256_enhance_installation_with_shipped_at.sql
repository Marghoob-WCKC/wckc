alter table installation 
add column shipped_at timestamptz;

create or replace function update_shipped_at()
returns trigger as $$
begin

  if new.has_shipped = true and (old.has_shipped is distinct from true) then
    new.shipped_at = now();
  
  elsif new.has_shipped = false and (old.has_shipped is distinct from false) then
    new.shipped_at = null; 
  end if;
  
  return new;
end;
$$ language plpgsql;

create trigger on_has_shipped_change
before update on installation
for each row
when (old.has_shipped is distinct from new.has_shipped)
execute function update_shipped_at();