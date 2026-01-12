CREATE OR REPLACE FUNCTION public.trigger_check_production_subtasks()
RETURNS TRIGGER AS $$
DECLARE
    v_canopy_req boolean;
    v_custom_req boolean;
BEGIN

    SELECT 
        COALESCE(so.is_canopy_required, false),
        COALESCE(so.is_custom_cab_required, false)
    INTO v_canopy_req, v_custom_req
    FROM public.jobs j
    JOIN public.sales_orders so ON j.sales_order_id = so.id
    WHERE j.prod_id = NEW.prod_id; 

   
    IF (NEW.cust_fin_parts_cut_completed_actual IS NOT NULL AND NEW.cust_fin_assembled_completed_actual IS NOT NULL) THEN
        IF NEW.custom_finish_completed_actual IS NULL THEN
            NEW.custom_finish_completed_actual := NOW();
        END IF;
    ELSE
        NEW.custom_finish_completed_actual := NULL;
    END IF;


    IF (
        NEW.paint_doors_completed_actual IS NOT NULL 
        AND (v_canopy_req IS FALSE OR NEW.paint_canopy_completed_actual IS NOT NULL)
        AND (v_custom_req IS FALSE OR NEW.paint_cust_cab_completed_actual IS NOT NULL)
    ) THEN
        IF NEW.paint_completed_actual IS NULL THEN
             NEW.paint_completed_actual := NOW();
        END IF;
    ELSE
        NEW.paint_completed_actual := NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;