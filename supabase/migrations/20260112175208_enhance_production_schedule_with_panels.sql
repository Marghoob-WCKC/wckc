
ALTER TABLE public.production_schedule
ADD COLUMN panel_completed_actual timestamptz;


UPDATE public.production_schedule
SET panel_completed_actual = cut_finish_completed_actual
WHERE cut_finish_completed_actual IS NOT NULL;