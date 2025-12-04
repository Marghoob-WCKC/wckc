CREATE OR REPLACE FUNCTION "public"."create_master_order_transaction"("p_payload" "jsonb") RETURNS TABLE("out_job_number" "text", "out_sales_order_number" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$DECLARE
    v_cabinet_id bigint;
    v_sales_order_id bigint;
    v_so_number text;
    v_job_number text;
BEGIN
    -- 1. INSERT CABINETS
    -- FIX: Target the new Foreign Key columns (*_id) and read the corresponding JSON ID keys
    INSERT INTO public.cabinets (
        species_id, color_id, door_style_id, -- CORRECTED TARGET COLUMNS
        finish, glaze, top_drawer_front,
        interior, drawer_box, drawer_hardware, box, hinge_soft_close,
        doors_parts_only, handles_supplied, handles_selected, glass, piece_count, glass_type
    )
    VALUES (
        (p_payload->'cabinet'->>'species_id')::bigint, -- FIX: Read 'species_id' and cast to BIGINT
        (p_payload->'cabinet'->>'color_id')::bigint,   -- FIX: Read 'color_id' and cast to BIGINT
        (p_payload->'cabinet'->>'door_style_id')::bigint, -- FIX: Read 'door_style_id' and cast to BIGINT
        
        p_payload->'cabinet'->>'finish', p_payload->'cabinet'->>'glaze', p_payload->'cabinet'->>'top_drawer_front',
        p_payload->'cabinet'->>'interior', p_payload->'cabinet'->>'drawer_box', p_payload->'cabinet'->>'drawer_hardware',
        p_payload->'cabinet'->>'box', (p_payload->'cabinet'->>'hinge_soft_close')::boolean,
        (p_payload->'cabinet'->>'doors_parts_only')::boolean, (p_payload->'cabinet'->>'handles_supplied')::boolean,
        (p_payload->'cabinet'->>'handles_selected')::boolean, (p_payload->'cabinet'->>'glass')::boolean,
        p_payload->'cabinet'->>'piece_count', p_payload->'cabinet'->>'glass_type'
    )
    RETURNING id INTO v_cabinet_id;
    
    -- 2. GENERATE SALES ORDER NUMBER (ATOMICALLY)
    v_so_number := generate_next_sales_order_number((p_payload->>'stage')::"SalesStage");

    -- 3. INSERT SALES ORDER (Quote/Sold)
    INSERT INTO public.sales_orders (
        client_id, cabinet_id, stage, total, deposit, designer, comments, install, 
        order_type, delivery_type, sales_order_number, -- Injected atomic number
        shipping_client_name, shipping_street, shipping_city, shipping_province, shipping_zip,
        shipping_phone_1, shipping_phone_2, shipping_email_1, shipping_email_2,
        layout_date, client_meeting_date, follow_up_date, appliance_specs_date, selections_date, 
        markout_date, review_date, second_markout_date, flooring_type, flooring_clearance, is_memo
    )
    VALUES (
        (p_payload->>'client_id')::bigint, v_cabinet_id, (p_payload->>'stage')::"SalesStage", (p_payload->>'total')::numeric, (p_payload->>'deposit')::numeric, 
        p_payload->>'designer', p_payload->>'comments', (p_payload->>'install')::boolean, 
        p_payload->>'order_type', p_payload->>'delivery_type', v_so_number,
        p_payload->'shipping'->>'shipping_client_name', p_payload->'shipping'->>'shipping_street', p_payload->'shipping'->>'shipping_city', p_payload->'shipping'->>'shipping_province', p_payload->'shipping'->>'shipping_zip',
        p_payload->'shipping'->>'shipping_phone_1', p_payload->'shipping'->>'shipping_phone_2', p_payload->'shipping'->>'shipping_email_1', p_payload->'shipping'->>'shipping_email_2',
        (p_payload->'checklist'->>'layout_date')::timestamp with time zone, (p_payload->'checklist'->>'client_meeting_date')::timestamp with time zone, (p_payload->'checklist'->>'follow_up_date')::timestamp with time zone,
        (p_payload->'checklist'->>'appliance_specs_date')::timestamp with time zone, (p_payload->'checklist'->>'selections_date')::timestamp with time zone, 
        (p_payload->'checklist'->>'markout_date')::timestamp with time zone, (p_payload->'checklist'->>'review_date')::timestamp with time zone, (p_payload->'checklist'->>'second_markout_date')::timestamp with time zone,
        p_payload->'checklist'->>'flooring_type', p_payload->'checklist'->>'flooring_clearance', (p_payload->>'is_memo')::boolean
    )
    RETURNING id INTO v_sales_order_id;

    -- 4. CONDITIONAL JOB INSERT (SOLD)
    IF (p_payload->>'stage')::text = 'SOLD' THEN
        -- MANUAL JOB DUPLICATE CHECK (CORRECTED)
        PERFORM id FROM public.jobs
        WHERE job_base_number = (p_payload->>'manual_job_base')::integer
        -- This operator safely handles NULLs vs Values vs Empty Strings
        AND job_suffix IS NOT DISTINCT FROM (p_payload->>'manual_job_suffix');

        IF FOUND THEN
            RAISE EXCEPTION 'Job %-% already exists!', 
                p_payload->>'manual_job_base', 
                COALESCE(p_payload->>'manual_job_suffix', '(No Suffix)');
        END IF;

        -- INSERT JOB
        INSERT INTO public.jobs (sales_order_id, job_base_number, job_suffix)
        VALUES (
            v_sales_order_id, 
            (p_payload->>'manual_job_base')::integer, 
            p_payload->>'manual_job_suffix'
        )
        RETURNING job_number INTO v_job_number;
        
        out_job_number := v_job_number;
    ELSE
        out_job_number := NULL;
    END IF;

    out_sales_order_number := v_so_number;

    RETURN NEXT;
END;$$;