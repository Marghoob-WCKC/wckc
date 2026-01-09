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
      let query = supabase
        .from("warehouse_tracking_view")
        .select("*", { count: "exact" });

      columnFilters.forEach((filter) => {
        const { id, value } = filter;
        if (!value) return;

        const valStr = String(value);

        switch (id) {
          case "job_number":
            query = query.ilike("job_number", `%${valStr}%`);
            break;
          case "shipping_client_name":
            query = query.ilike("shipping_client_name", `%${valStr}%`);
            break;
          case "shipping_address":
            query = query.ilike("shipping_address", `%${valStr}%`);
            break;
          default:
            break;
        }
      });

      if (sorting.length > 0) {
        const { id, desc } = sorting[0];
        query = query.order(id, { ascending: !desc });
      } else {
        query = query.order("dropoff_date", { ascending: false });
      }

      const from = pagination.pageIndex * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw new Error(error.message);

      return { data: data as WarehouseTrackingView[], count };
    },
    enabled: isAuthenticated,
    placeholderData: (previousData) => previousData,
  });
}
