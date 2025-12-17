import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/hooks/useSupabase";
import {
  PaginationState,
  ColumnFiltersState,
  SortingState,
} from "@tanstack/react-table";

interface UseBackordersTableParams {
  pagination: PaginationState;
  columnFilters: ColumnFiltersState;
  sorting: SortingState;
}

export function useBackordersTable({
  pagination,
  columnFilters,
  sorting,
}: UseBackordersTableParams) {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: ["backorders_view", pagination, columnFilters, sorting],
    queryFn: async () => {
      let query = supabase
        .from("backorders_view" as any)
        .select("*", { count: "exact" });

      columnFilters.forEach((filter) => {
        const { id, value } = filter;
        const valStr = String(value);
        if (!valStr) return;

        switch (id) {
          case "job_number":
            query = query.ilike("job_number", `%${valStr}%`);
            break;
          case "shipping_client_name":
            query = query.ilike("shipping_client_name", `%${valStr}%`);
            break;
          case "comments":
            query = query.ilike("comments", `%${valStr}%`);
            break;
          case "complete":
            if (valStr !== "all") {
              query = query.eq("complete", valStr === "true");
            }
            break;
        }
      });

      if (sorting.length > 0) {
        const { id, desc } = sorting[0];
        query = query.order(id, { ascending: !desc });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const from = pagination.pageIndex * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) throw new Error(error.message);

      return { data, count };
    },
    placeholderData: (previousData) => previousData,
  });
}
