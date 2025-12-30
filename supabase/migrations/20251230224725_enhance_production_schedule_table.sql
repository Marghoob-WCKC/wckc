ALTER TABLE public.production_schedule
ADD COLUMN in_plant_cabinets_actual timestamptz;

UPDATE public.production_schedule
SET in_plant_cabinets_actual = in_plant_actual
WHERE in_plant_actual IS NOT NULL;