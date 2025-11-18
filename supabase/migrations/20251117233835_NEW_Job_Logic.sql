-- Migration: reverse_fk_and_update_rpc.sql

-- 1. DROP OLD CONSTRAINTS AND COLUMN (sales_orders no longer points to jobs)
ALTER TABLE public.sales_orders DROP CONSTRAINT IF EXISTS sales_orders_job_id_fkey;
ALTER TABLE public.sales_orders DROP COLUMN IF EXISTS job_id; -- This column is obsolete

-- 2. ADD NEW FK COLUMN TO JOBS TABLE
-- This column holds the link to the Sales Order that owns this Job.
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS sales_order_id BIGINT;

-- 3. ENFORCE 1:1 RELATIONSHIP (jobs table points back to sales_orders)
-- The UNIQUE constraint ensures no two jobs can link to the same sales order.
ALTER TABLE public.jobs
ADD CONSTRAINT uq_jobs_sales_order_id UNIQUE (sales_order_id);

ALTER TABLE public.jobs
ADD CONSTRAINT fk_jobs_sales_order_id
    FOREIGN KEY (sales_order_id)
    REFERENCES public.sales_orders(id)
    ON DELETE RESTRICT;

-- 4. CLEANUP OBSOLETE FUNCTION
DROP FUNCTION IF EXISTS create_job_single(int);

-- 5. CREATE FINAL RPC FUNCTION
-- Creates a Job record and links it to the newly inserted Sales Order ID (p_sales_order_id).
CREATE OR REPLACE FUNCTION create_job_and_link_so(
    p_sales_order_id bigint, -- NEW: The ID of the Sales Order record already inserted
    p_existing_base_number int default null
)
RETURNS TABLE (
    out_job_id bigint, 
    out_job_suffix text, 
    out_job_base_number int,
    out_job_number text
) 
language plpgsql
security definer 
as $$
declare
    new_base_num int;
    new_suffix text := null;
    max_suffix_char text;
    current_job_id bigint;
    v_captured_job_number text;
begin
    -- 1. DETERMINE BASE NUMBER MODE
    IF p_existing_base_number IS NOT NULL AND p_existing_base_number > 0 THEN
        -- LINKED JOB MODE
        new_base_num := p_existing_base_number;

        SELECT MAX(job_suffix) INTO max_suffix_char
        FROM public.jobs
        WHERE job_base_number = new_base_num;
        
        IF max_suffix_char IS NULL OR max_suffix_char = '' THEN
            new_suffix := 'A';
        ELSE
            new_suffix := chr(ascii(max_suffix_char) + 1);
        END IF;
    ELSE
        -- NEW GROUP MODE: Get next unique number from sequence
        new_base_num := nextval('job_number_seq');
        new_suffix := null;
    END IF;

    -- 2. INSERT NEW JOB ROW AND LINK TO SALES ORDER
    -- The unique sales_order_id is inserted here directly.
    INSERT INTO jobs (job_base_number, job_suffix, sales_order_id)
    VALUES (new_base_num, new_suffix, p_sales_order_id)
    RETURNING id, job_number INTO current_job_id, v_captured_job_number;

    -- 3. RETURN RESULTS
    out_job_id := current_job_id;
    out_job_suffix := new_suffix;
    out_job_base_number := new_base_num;
    out_job_number := v_captured_job_number;

    RETURN NEXT;
END;
$$;