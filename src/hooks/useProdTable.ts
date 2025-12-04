import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/hooks/useSupabase";
import {
  PaginationState,
  ColumnFiltersState,
  SortingState,
} from "@tanstack/react-table";

interface UseProdTableParams {
  pagination: PaginationState;
  columnFilters: ColumnFiltersState;
  sorting: SortingState;
}

export function useProdTable({
  pagination,
  columnFilters,
  sorting,
}: UseProdTableParams) {
  const { supabase, isAuthenticated } = useSupabase();

  return useQuery({
    queryKey: ["prod_table_view", pagination, columnFilters, sorting],
    queryFn: async () => {
      let query = supabase
        .from("prod_table_view")
        .select("*", { count: "exact" });

      columnFilters.forEach((filter) => {
        const { id, value } = filter;
        const valStr = String(value);
        if (!valStr) return;

        switch (id) {
          case "job_number":
            query = query.ilike("job_number", `%${valStr}%`);
            break;
          case "client":
            query = query.ilike("shipping_client_name", `%${valStr}%`);
            break;
          case "site_address":
            query = query.ilike("site_address", `%${valStr}%`);
            break;
          case "received_date":
            query = query.eq("received_date", valStr);
            break;
          case "placement_date":
            query = query.eq("placement_date", valStr);
            break;
          case "ship_schedule":
            query = query.eq("ship_schedule", valStr);
            break;
          default:
            query = query.ilike(id, `%${valStr}%`);
        }
      });
      if (sorting.length > 0) {
        const { id, desc } = sorting[0];
        const dbColumn = id === "client" ? "shipping_client_name" : id;
        query = query.order(dbColumn, { ascending: !desc });
      } else {
        query = query.order("job_number", { ascending: false });
      }
      const from = pagination.pageIndex * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return {
        data: data,
        count,
      };
    },
    enabled: isAuthenticated,
    placeholderData: (previousData) => previousData,
  });
}
