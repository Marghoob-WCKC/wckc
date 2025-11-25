-- Add wrap_completed timestamp to installation table
ALTER TABLE public.installation 
ADD COLUMN wrap_completed timestamptz DEFAULT NULL;