import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/hooks/useSupabase";
import {
  PaginationState,
  ColumnFiltersState,
  SortingState,
} from "@tanstack/react-table";

interface UseServiceOrdersTableParams {
  pagination: PaginationState;
  columnFilters: ColumnFiltersState;
  sorting: SortingState;
  statusFilter: "ALL" | "OPEN" | "COMPLETED";
}

export function useServiceOrdersTable({
  pagination,
  columnFilters,
  sorting,
  statusFilter,
}: UseServiceOrdersTableParams) {
  const { supabase, isAuthenticated } = useSupabase();

  return useQuery({
    queryKey: [
      "service_orders_table_view",
      pagination,
      columnFilters,
      sorting,
      statusFilter,
    ],
    queryFn: async () => {
      let query = supabase
        .from("service_orders_table_view" as any)
        .select("*", { count: "exact" });

      if (statusFilter === "OPEN") {
        query = query.is("completed_at", null);
      } else if (statusFilter === "COMPLETED") {
        query = query.not("completed_at", "is", null);
      }

      columnFilters.forEach((filter) => {
        const { id, value } = filter;
        const valStr = String(value);
        if (!valStr) return;

        switch (id) {
          case "service_order_number":
            query = query.ilike("service_order_number", `%${valStr}%`);
            break;
          case "job_number":
            query = query.ilike("job_number", `%${valStr}%`);
            break;
          case "client_name":
            query = query.ilike("client_name", `%${valStr}%`);
            break;
          case "site_address":
            query = query.ilike("site_address", `%${valStr}%`);
            break;
          case "date_entered":
            query = query.eq("date_entered", valStr);
            break;
          default:
            break;
        }
      });

      if (sorting.length > 0) {
        const { id, desc } = sorting[0];
        const dbColumn = id;
        query = query.order(dbColumn, { ascending: !desc });
      } else {
        query = query.order("date_entered", { ascending: false });
      }

      const from = pagination.pageIndex * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return {
        data,
        count,
      };
    },
    enabled: isAuthenticated,
    placeholderData: (previousData) => previousData,
  });
}
