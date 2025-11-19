CREATE TYPE "ShippingStatus" AS ENUM ('unprocessed', 'tentative', 'confirmed');

CREATE TABLE production_schedule (
    job_id BIGINT PRIMARY KEY REFERENCES jobs (id) ON DELETE CASCADE,
    rush BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    placement_date DATE,
    doors_in_schedule DATE,
    doors_out_schedule DATE,
    cut_finish_schedule DATE,
    cut_melamine_schedule DATE,
    paint_in_schedule DATE,
    paint_out_schedule DATE,
    assembly_schedule DATE,
    ship_schedule DATE,
    in_plant_actual TIMESTAMPTZ,
    doors_completed_actual TIMESTAMPTZ,
    cut_finish_completed_actual TIMESTAMPTZ,
    custom_finish_completed_actual TIMESTAMPTZ,
    drawer_completed_actual TIMESTAMPTZ,
    cut_melamine_completed_actual TIMESTAMPTZ,
    paint_completed_actual TIMESTAMPTZ,
    assembly_completed_actual TIMESTAMPTZ,
    box_assembled_count INTEGER NOT NULL DEFAULT 0,
    ship_status "ShippingStatus" NOT NULL DEFAULT 'unprocessed',
    ship_confirmed_date DATE,
    ship_confirmed_legacy BOOLEAN
);

CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER set_production_schedule_updated_at
BEFORE UPDATE ON public.production_schedule
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();
