ALTER TABLE public.jobs 
ALTER COLUMN job_number
set expression AS (
  COALESCE('-' || job_suffix, '')
);

ALTER TABLE public.jobs 
ALTER COLUMN job_base_number TYPE text;

ALTER TABLE public.jobs 
ALTER COLUMN job_number
set expression AS (
  job_base_number || COALESCE('-' || job_suffix, '')
);