import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/hooks/useSupabase";
import dayjs from "dayjs";

export type JobStatusItem = {
  id: number;
  job_number: string;
  shipping_client_name: string;
  shipping_address: string;
  date_sold: string;
  // Production Actuals
  cut_melamine: string | null;
  cut_finish: string | null;
  custom_finish: string | null;
  doors: string | null;
  drawers: string | null;
  paint: string | null;
  assembly: string | null;
  // New Fields
  wrap: string | null;
  // Shipped removed as we only show non-shipped

  // Computed
  completion_percentage: number;
};

type DateRange = [Date | null, Date | null];

export function useJobStatusReport(dateRange: DateRange) {
  const { supabase, isAuthenticated } = useSupabase();

  return useQuery({
    queryKey: ["job_status_report", dateRange],
    queryFn: async () => {
      let query = supabase
        .from("jobs")
        .select(
          `
          id,
          job_number,
          sales_orders!inner (
            date_sold,
            shipping_client_name,
            shipping_street,
            shipping_city,
            shipping_province,
            shipping_zip
          ),
          production_schedule!inner (
            ship_schedule,
            cut_melamine_completed_actual,
            cut_finish_completed_actual,
            custom_finish_completed_actual,
            doors_completed_actual,
            drawer_completed_actual,
            paint_completed_actual,
            assembly_completed_actual
          ),
          installation!inner (
            wrap_completed,
            has_shipped
          )
        `
        )
        // FILTER: Only show jobs that have NOT shipped
        .eq("installation.has_shipped", false);

      // Apply Filter on Sales Order Date Sold
      if (dateRange[0]) {
        query = query.gte(
          "sales_orders.date_sold",
          dayjs(dateRange[0]).format("YYYY-MM-DD")
        );
      }
      if (dateRange[1]) {
        query = query.lte(
          "sales_orders.date_sold",
          dayjs(dateRange[1]).format("YYYY-MM-DD")
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      // --- CLIENT SIDE SORTING ---
      const sortedData = data.sort((a: any, b: any) => {
        const dateA = new Date(a.sales_orders.date_sold).getTime();
        const dateB = new Date(b.sales_orders.date_sold).getTime();
        return dateB - dateA;
      });

      return sortedData.map((job: any) => {
        const prod = job.production_schedule;
        const so = job.sales_orders;
        const inst = job.installation;

        // Define all steps for completion % (Now 8 steps, removed Ship)
        const steps = [
          prod.cut_melamine_completed_actual,
          prod.cut_finish_completed_actual,
          prod.custom_finish_completed_actual,
          prod.doors_completed_actual,
          prod.drawer_completed_actual,
          prod.paint_completed_actual,
          prod.assembly_completed_actual,
          inst?.wrap_completed, // Wrap
        ];

        const completedSteps = steps.filter(
          (step) => step !== null && step !== false
        ).length;
        const percentage = Math.round((completedSteps / steps.length) * 100);

        const address = [
          so.shipping_street,
          so.shipping_city,
          so.shipping_province,
          so.shipping_zip,
        ]
          .filter(Boolean)
          .join(", ");

        return {
          id: job.id,
          job_number: job.job_number,
          date_sold: so.date_sold,
          shipping_client_name: so.shipping_client_name || "Unknown",
          shipping_address: address,
          cut_melamine: prod.cut_melamine_completed_actual,
          cut_finish: prod.cut_finish_completed_actual,
          custom_finish: prod.custom_finish_completed_actual,
          doors: prod.doors_completed_actual,
          drawers: prod.drawer_completed_actual,
          paint: prod.paint_completed_actual,
          assembly: prod.assembly_completed_actual,
          wrap: inst?.wrap_completed || null,
          completion_percentage: percentage,
        };
      }) as JobStatusItem[];
    },
    enabled: isAuthenticated,
  });
}
