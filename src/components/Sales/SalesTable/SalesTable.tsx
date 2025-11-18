"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
  PaginationState,
  getPaginationRowModel,
  ColumnFiltersState,
  FilterFn,
  getFacetedRowModel,
  getFacetedUniqueValues,
} from "@tanstack/react-table";
import {
  Table,
  TextInput,
  Group,
  Loader,
  Pagination,
  ScrollArea,
  Center,
  Text,
  Box,
  Accordion,
  Tooltip,
  ActionIcon,
  Button,
  SimpleGrid,
  Badge,
} from "@mantine/core";
import {
  FaPlus,
  FaSearch,
  FaSort,
  FaSortDown,
  FaSortUp,
  FaEye,
} from "react-icons/fa";
import { useDisclosure } from "@mantine/hooks";
import { useSupabase } from "@/hooks/useSupabase";

// --- TYPE DEFINITIONS (Provided by User) ---
interface SalesOrderView {
  id: number;
  sales_order_number: string;
  stage: "QUOTE" | "SOLD";
  invoice_balance: number;
  designer: string;
  created_at: string;
  client: { lastName: string; street: string; city: string };
  job_ref: { job_number: string | null; job_base_number: number | null } | null;
}

const genericFilter: FilterFn<SalesOrderView> = (
  row,
  columnId,
  filterValue
) => {
  const filterText = String(filterValue).toLowerCase();
  let cellValue;

  if (columnId.includes(".")) {
    const keys = columnId.split(".");
    const parentObject = row.original[keys[0] as keyof SalesOrderView];

    if (parentObject && typeof parentObject === "object" && keys.length === 2) {
      cellValue = parentObject[keys[1] as keyof typeof parentObject];
    }
  } else {
    cellValue = row.getValue(columnId);
  }

  const val = String(cellValue ?? "").toLowerCase();
  return val.includes(filterText);
};

// --- START OF COMPONENT ---

export default function SalesTable() {
  // ----------------------------------------------------
  // 1. STATE & HOOKS
  // ----------------------------------------------------
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const { supabase, isAuthenticated } = useSupabase();
  const router = useRouter();

  const [viewModalOpened, { open: viewModalOpen, close: viewModalClose }] =
    useDisclosure(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrderView | null>(
    null
  );

  // NEW STATE: Tracks the active filter pill
  const [stageFilter, setStageFilter] = useState<"ALL" | "QUOTE" | "SOLD">(
    "ALL"
  );

  // --- DATA FETCHING (TanStack Query) ---
  const {
    data: orders,
    isLoading: loading,
    isError,
    error,
  } = useQuery<SalesOrderView[]>({
    queryKey: ["sales_orders_full_list"],
    queryFn: async () => {
      // NOTE: Querying sales_orders as primary source
      const { data, error: dbError } = await supabase
        .from("sales_orders")
        .select(
          `
            id, sales_order_number, stage, total, deposit, invoice_balance, designer, created_at,
            client:client_id (lastName, street, city),
            job_ref:jobs (job_number, job_base_number) 
        `
        )
        .order("created_at", { ascending: false });

      if (dbError)
        throw new Error(dbError.message || "Failed to fetch sales orders");
      return data as unknown as SalesOrderView[];
    },
    enabled: isAuthenticated,
    placeholderData: (previousData) => previousData,
  });

  // --- DATA FILTERING (In-Memory Filter for Pills) ---
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    if (stageFilter === "ALL") return orders;

    // Filter based on the selected stage pill
    return orders.filter((order) => order.stage === stageFilter);
  }, [orders, stageFilter]);

  // --- REACT TABLE DEFINITION ---
  const columnHelper = createColumnHelper<SalesOrderView>();
  const columns = useMemo(
    () => [
      columnHelper.accessor("sales_order_number", {
        header: "Id",
        size: 50,
        minSize: 60,
        enableColumnFilter: true,
        filterFn: "includesString" as any, // Use includesString for simplicity
        cell: (info) => (
          <Text
            size="sm"
            fw={600}
            c={info.row.original.stage === "SOLD" ? "green.8" : "blue.8"}
          >
            {info.getValue()}
          </Text>
        ),
      }),
      ...(stageFilter !== "QUOTE"
        ? [
            columnHelper.accessor("job_ref.job_number", {
              id: "job_number",
              header: "Job Number",
              size: 50,
              minSize: 60,
              enableColumnFilter: true,
              filterFn: genericFilter as any,
              cell: (info) => <Text fw={700}>{info.getValue() || "—"}</Text>,
            }),
          ]
        : []),
      columnHelper.accessor("stage", {
        header: "Status",
        size: 40,
        minSize: 40,
        cell: (info) => (
          <Badge
            color={info.getValue() === "SOLD" ? "green" : "blue"}
            variant="light"
          >
            {info.getValue()}
          </Badge>
        ),
        enableColumnFilter: false, // Filtering handled by the pills above
      }),
      columnHelper.accessor("designer", {
        header: "Designer",
        size: 60,
        minSize: 30,
        filterFn: "includesString" as any,
      }),
      columnHelper.accessor("client.lastName", {
        id: "clientlastName",
        header: "Client Name",
        size: 150,
        minSize: 60,
        enableColumnFilter: true,
        filterFn: genericFilter as any,
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("client.street", {
        header: "Address",
        size: 80,
        minSize: 30,
      }),
      columnHelper.accessor("client.city", {
        header: "City",
        size: 40,
        minSize: 30,
      }),
      columnHelper.accessor("invoice_balance", {
        header: "Balance",
        size: 100,
        minSize: 60,
        cell: (info) => `$${(info.getValue() as number)?.toFixed(2) || "0.00"}`,
      }),
      columnHelper.accessor("created_at", {
        header: "Created",
        size: 130,
        minSize: 60,
        cell: (info) => new Date(info.getValue<string>()).toLocaleDateString(),
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        size: 90,
        minSize: 60,
        cell: (info) => (
          <Group justify="center">
            <Tooltip label="View Details / Edit">
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => {
                  setSelectedOrder(info.row.original);
                  viewModalOpen();
                }}
              >
                <FaEye size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        ),
      }),
    ],
    [columnHelper]
  );

  const table = useReactTable({
    data: filteredOrders, // CRITICAL: Pass the locally filtered data here
    columns,
    state: {
      columnFilters,
      pagination,
    },
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });
  type StageKey = "ALL" | "QUOTE" | "SOLD";

  const stageItems: {
    key: StageKey;
    label: string;
    color: string;
    count: number;
  }[] = [
    {
      key: "ALL",
      label: "All Orders",
      color: "black",
      count: orders?.length || 0,
    },
    {
      key: "QUOTE",
      label: "Quotes",
      color: "blue",
      count: orders?.filter((o) => o.stage === "QUOTE").length || 0,
    },
    {
      key: "SOLD",
      label: "Jobs",
      color: "green",
      count: orders?.filter((o) => o.stage === "SOLD").length || 0,
    },
  ];
  // --- GATING LOGIC ---
  if (!isAuthenticated || loading) {
    return (
      <Center style={{ height: "300px" }}>
        <Loader />
      </Center>
    );
  }
  if (isError) {
    return (
      <Center style={{ height: "300px" }}>
        <Text c="red">Error: {error?.message}</Text>
      </Center>
    );
  }

  return (
    <Box>
      <Group justify="flex-end" mb="md">
        <Button
          onClick={() => router.push("/dashboard/sales/new")}
          leftSection={<FaPlus size={14} />}
        >
          New Sales Order
        </Button>
      </Group>

      {/* --- STATUS FILTER PILLS --- */}

      <Group mb="md" gap={8} wrap="wrap">
        {stageItems.map((item) => (
          <Button
            key={item.key}
            variant={stageFilter === item.key ? "filled" : "light"}
            color={item.color}
            radius="xl"
            size="sm"
            onClick={() => setStageFilter(item.key)}
            style={{ cursor: "pointer", minWidth: 120 }}
            px={12}
          >
            <Group gap={6}>
              <Text fw={600} size="sm">
                {item.label}
              </Text>
              <Badge
                autoContrast
                color={stageFilter === item.key ? "white" : item.color}
                variant={stageFilter === item.key ? "filled" : "light"}
                radius="sm"
                size="sm"
                style={{ cursor: "inherit" }}
              >
                {item.count}
              </Badge>
            </Group>
          </Button>
        ))}
      </Group>

      {/* SEARCH/FILTER ACCORDION */}
      <Accordion variant="contained" radius="md" mb="md">
        <Accordion.Item value="search-filters">
          <Accordion.Control icon={<FaSearch size={16} />}>
            Search Filters
          </Accordion.Control>
          <Accordion.Panel>
            <SimpleGrid cols={{ base: 1, sm: 3 }} mt="sm" spacing="sm">
              <TextInput
                placeholder="Id..."
                onChange={(e) =>
                  table
                    .getColumn("sales_order_number")
                    ?.setFilterValue(e.target.value)
                }
              />
              <TextInput
                placeholder="Jo Number..."
                onChange={(e) =>
                  table.getColumn("job_number")?.setFilterValue(e.target.value)
                }
              />
              <TextInput
                placeholder="Client Name..."
                onChange={(e) =>
                  table
                    .getColumn("clientlastName")
                    ?.setFilterValue(e.target.value)
                }
              />
            </SimpleGrid>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      {/* DATA TABLE */}
      <ScrollArea mt="md">
        <Table striped highlightOnHover withColumnBorders layout="fixed">
          <Table.Thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <Table.Th
                    key={header.id}
                    colSpan={header.colSpan}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ width: header.getSize(), cursor: "pointer" }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    <span className="inline-block ml-1">
                      {header.column.getIsSorted() === "asc" && <FaSortUp />}
                      {header.column.getIsSorted() === "desc" && <FaSortDown />}
                      {!header.column.getIsSorted() && <FaSort opacity={0.1} />}
                    </span>
                  </Table.Th>
                ))}
              </Table.Tr>
            ))}
          </Table.Thead>
          <Table.Tbody>
            {/* Show message if filter results in no data */}
            {table.getRowModel().rows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length}>
                  <Center>
                    <Text c="dimmed">
                      No orders found matching the filters/selection.
                    </Text>
                  </Center>
                </Table.Td>
              </Table.Tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <Table.Tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <Table.Td
                      key={cell.id}
                      style={{
                        width: cell.column.getSize(),
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      {/* PAGINATION */}
      <Group justify="center" mt="md">
        <Pagination
          hideWithOnePage
          total={table.getPageCount()}
          value={table.getState().pagination.pageIndex + 1}
          onChange={(page) => table.setPageIndex(page - 1)}
        />
      </Group>

      {/* DETAIL MODAL (Conceptual) */}
      {/* {selectedOrder && (
        <OrderDetailsModal 
          opened={viewModalOpened} 
          onClose={viewModalClose} 
          order={selectedOrder} 
        />
      )} */}
    </Box>
  );
}
