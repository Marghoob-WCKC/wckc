import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/hooks/useSupabase";
import {
  PaginationState,
  ColumnFiltersState,
  SortingState,
} from "@tanstack/react-table";
import dayjs from "dayjs";
import { Database } from "@/types/supabase";

type WarehouseTrackingView =
  Database["public"]["Views"]["warehouse_tracking_view"]["Row"];

interface UseWarehouseTrackingTableProps {
  pagination: PaginationState;
  columnFilters: ColumnFiltersState;
  sorting: SortingState;
}

export function useWarehouseTrackingTable({
  pagination,
  columnFilters,
  sorting,
}: UseWarehouseTrackingTableProps) {
  const { supabase, isAuthenticated } = useSupabase();

  return useQuery({
    queryKey: ["warehouse_tracking_view", pagination, columnFilters, sorting],
    queryFn: async () => {
      const applyFilters = (q: any) => {
        columnFilters.forEach((filter) => {
          const { id, value } = filter;
          if (!value) return;

          if (id === "dropoff_date_range" || id === "pickup_date_range") {
            const [start, end] = value as [Date | null, Date | null];
            const field =
              id === "dropoff_date_range" ? "dropoff_date" : "pickup_date";
            if (start)
              q = q.gte(field, dayjs(start).startOf("day").toISOString());
            if (end) q = q.lte(field, dayjs(end).endOf("day").toISOString());
            return;
          }

          const valStr = String(value);

          switch (id) {
            case "job_number":
              q = q.ilike("job_number", `%${valStr}%`);
              break;
            case "shipping_client_name":
              q = q.ilike("shipping_client_name", `%${valStr}%`);
              break;
            case "shipping_address":
              q = q.ilike("shipping_address", `%${valStr}%`);
              break;
            case "not_picked":
              if (valStr === "true") {
                q = q.is("pickup_date", null);
              }
              break;
          }
        });
        return q;
      };

      let query = supabase
        .from("warehouse_tracking_view")
        .select("*", { count: "exact" });

      query = applyFilters(query);

      if (sorting.length > 0) {
        const { id, desc } = sorting[0];
        query = query.order(id, { ascending: !desc });
      } else {
        query = query.order("dropoff_date", { ascending: false });
      }

      const from = pagination.pageIndex * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      query = query.range(from, to);

      // Summary query for total pallets in warehouse
      let summaryQuery = supabase
        .from("warehouse_tracking_view")
        .select("pallets");

      summaryQuery = applyFilters(summaryQuery);
      summaryQuery = summaryQuery.is("pickup_date", null);

      const [dataRes, summaryRes] = await Promise.all([query, summaryQuery]);

      if (dataRes.error) throw new Error(dataRes.error.message);

      const totalPallets =
        summaryRes.data?.reduce((sum, row) => sum + (row.pallets || 0), 0) || 0;

      return {
        data: dataRes.data as WarehouseTrackingView[],
        count: dataRes.count,
        totalPallets,
      };
    },
    enabled: isAuthenticated,
    placeholderData: (previousData) => previousData,
  });
}
