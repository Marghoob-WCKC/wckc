import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/hooks/useSupabase";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";

export interface BulkSchedulePayload {
  installationIds: number[];
  // Installation Table Fields
  installer_id?: number | null;
  installation_date?: Date | null;
  inspection_date?: Date | null;
  installation_notes?: string;
  wrap_date?: Date | null;
  wrap_completed?: string | null; // ISO string or null
  has_shipped?: boolean;
  installation_completed?: string | null; // ISO string or null
  inspection_completed?: string | null; // ISO string or null

  // Production Schedule Fields (requires join, but we handle via ID lookup or assumption)
  // Note: We typically need prod_ids. For bulk simplicity, we might update via job link
  // or assume backend trigger. Here we will update via the relation in Supabase.
  ship_schedule?: Date | null;
  ship_status?: "unprocessed" | "tentative" | "confirmed";
}

export function useBulkSchedule() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: BulkSchedulePayload) => {
      const { installationIds, ...updates } = payload;

      // 1. Separate updates for 'installation' and 'production_schedule'
      const installUpdates: any = {};
      const prodUpdates: any = {};

      if (updates.installer_id !== undefined)
        installUpdates.installer_id = updates.installer_id;
      if (updates.installation_date !== undefined)
        installUpdates.installation_date = updates.installation_date
          ? dayjs(updates.installation_date).format("YYYY-MM-DD")
          : null;
      if (updates.inspection_date !== undefined)
        installUpdates.inspection_date = updates.inspection_date
          ? dayjs(updates.inspection_date).format("YYYY-MM-DD")
          : null;
      if (updates.wrap_date !== undefined)
        installUpdates.wrap_date = updates.wrap_date
          ? dayjs(updates.wrap_date).format("YYYY-MM-DD")
          : null;
      if (updates.wrap_completed !== undefined)
        installUpdates.wrap_completed = updates.wrap_completed;
      if (updates.has_shipped !== undefined)
        installUpdates.has_shipped = updates.has_shipped;
      if (updates.installation_completed !== undefined)
        installUpdates.installation_completed = updates.installation_completed;
      if (updates.inspection_completed !== undefined)
        installUpdates.inspection_completed = updates.inspection_completed;

      if (updates.ship_schedule !== undefined)
        prodUpdates.ship_schedule = updates.ship_schedule
          ? dayjs(updates.ship_schedule).format("YYYY-MM-DD")
          : null;
      if (updates.ship_status !== undefined)
        prodUpdates.ship_status = updates.ship_status;

      const promises = [];

      // 2. Perform Installation Update
      if (Object.keys(installUpdates).length > 0) {
        promises.push(
          supabase
            .from("installation")
            .update(installUpdates)
            .in("installation_id", installationIds)
        );
      }

      // 3. Perform Production Schedule Update
      // We need to find the prod_ids associated with these installations/jobs.
      // Since we only have installation_ids, we rely on the 'jobs' link or Update via Join if Supabase supported it directly.
      // Strategy: Fetch prod_ids first.
      if (Object.keys(prodUpdates).length > 0) {
        const { data: jobs } = await supabase
          .from("jobs")
          .select("prod_id")
          .in("installation_id", installationIds);

        const prodIds = jobs?.map((j) => j.prod_id).filter(Boolean) || [];

        if (prodIds.length > 0) {
          promises.push(
            supabase
              .from("production_schedule")
              .update(prodUpdates)
              .in("prod_id", prodIds)
          );
        }
      }

      const results = await Promise.all(promises);
      results.forEach((res) => {
        if (res.error) throw res.error;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["installation_table_view"] });
      notifications.show({
        title: "Success",
        message: "Bulk update completed successfully",
        color: "green",
      });
    },
    onError: (error) => {
      notifications.show({
        title: "Error",
        message: error.message,
        color: "red",
      });
    },
  });
}
