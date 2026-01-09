import { Views } from "@/types/db";
import { ShippingReportJob as WrapJob } from "@/documents/WrapSchedulePdf";
import { ShippingReportJob as ShippingJob } from "@/documents/ShippingReportPdf";

export const formatWrapScheduleData = (
  data: Views<"plant_table_view">[]
): WrapJob[] => {
  return data
    .filter((item) => !item.wrap_completed)
    .map(
      (item) =>
        ({
          ...item,
          id: item.job_id || item.installation_id || Math.random(),
          sales_orders: {
            shipping_client_name: item.client_name,
            shipping_city: item.shipping_city || "",
            shipping_street: item.shipping_street || "",
            shipping_province: item.shipping_province || "",
            cabinet: {
              box: item.cabinet_box || "0",
              door_styles: { name: item.cabinet_door_style || "" },
              species: { Species: item.cabinet_species || "" },
              colors: { Name: item.cabinet_color || "" },
            },
          },
          production_schedule: {
            placement_date: item.placement_date,
            ship_schedule: item.ship_schedule || "",
            doors_completed_actual: item.doors_completed_actual,
            cut_finish_completed_actual: item.cut_finish_completed_actual,
            custom_finish_completed_actual: item.custom_finish_completed_actual,
            paint_completed_actual: item.paint_completed_actual,
            assembly_completed_actual: item.assembly_completed_actual,
          },
          installation: {
            wrap_date: item.wrap_date,
          },
        } as unknown as WrapJob)
    );
};

export const formatShipScheduleData = (
  data: Views<"plant_table_view">[]
): ShippingJob[] => {
  return data
    .filter((item) => !item.has_shipped)
    .map(
      (item) =>
        ({
          ...item,
          id: item.job_id || item.installation_id || Math.random(),
          sales_orders: {
            shipping_client_name: item.client_name,
            shipping_city: item.shipping_city || "",
            shipping_street: item.shipping_street || "",
            shipping_province: item.shipping_province || "",
            cabinet: {
              box: item.cabinet_box || "0",
              door_styles: { name: item.cabinet_door_style || "" },
              species: { Species: item.cabinet_species || "" },
              colors: { Name: item.cabinet_color || "" },
            },
          },
          production_schedule: {
            placement_date: item.placement_date,
            ship_schedule: item.ship_schedule || "",
            doors_completed_actual: item.doors_completed_actual,
            cut_finish_completed_actual: item.cut_finish_completed_actual,
            custom_finish_completed_actual: item.custom_finish_completed_actual,
            paint_completed_actual: item.paint_completed_actual,
            assembly_completed_actual: item.assembly_completed_actual,
          },
          installation: {
            notes: item.installation_notes,
          },
        } as unknown as ShippingJob)
    );
};
