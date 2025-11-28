"use client";

import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  PaginationState,
  ColumnFiltersState,
  SortingState,
} from "@tanstack/react-table";
import {
  Table,
  ScrollArea,
  Text,
  Badge,
  Group,
  TextInput,
  Pagination,
  Box,
  rem,
  Loader,
  Center,
  Menu,
  Tooltip,
  Modal,
  Textarea,
  Button,
  Stack,
  ThemeIcon,
  Title,
  Accordion,
  SimpleGrid,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { GrEmergency } from "react-icons/gr";
import { useDisclosure } from "@mantine/hooks";
import {
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaCheck,
  FaTruckLoading,
  FaPencilAlt,
  FaShoppingBag,
} from "react-icons/fa";
import { useSupabase } from "@/hooks/useSupabase";
import { usePurchasingTable } from "@/hooks/usePurchasingTable";
import dayjs from "dayjs";
import { notifications } from "@mantine/notifications";
import { Views } from "@/types/db";

type PurchasingTableView = Views<"purchasing_table_view">;
const StatusCell = ({
  orderedAt,
  receivedAt,
  onUpdate,
  label,
}: {
  orderedAt: string | null;
  receivedAt: string | null;
  onUpdate: (field: "ordered" | "received", val: string | null) => void;
  label: string;
}) => {
  let badgeColor = "red";
  let statusText = "—";

  if (receivedAt) {
    badgeColor = "green";
    statusText = "Received";
  } else if (orderedAt) {
    badgeColor = "yellow";
    statusText = "Ordered";
  }

  return (
    <Menu shadow="md" width={200} withinPortal>
      <Menu.Target>
        <Badge
          color={badgeColor}
          variant="light"
          style={{ cursor: "pointer", width: "100%" }}
        >
          {statusText}
        </Badge>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item
          leftSection={<FaTruckLoading size={14} />}
          onClick={() => onUpdate("ordered", new Date().toISOString())}
          disabled={!!orderedAt}
        >
          Mark Ordered
        </Menu.Item>
        <Menu.Item
          leftSection={<FaCheck size={14} />}
          color="green"
          onClick={() => onUpdate("received", new Date().toISOString())}
          disabled={!!receivedAt}
        >
          Mark Received
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          color="red"
          onClick={() => {
            onUpdate("received", null);
            onUpdate("ordered", null);
          }}
        >
          Clear All
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};

export default function PurchasingTable() {
  const { supabase, isAuthenticated } = useSupabase();
  const queryClient = useQueryClient();

  // State Management
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [inputFilters, setInputFilters] = useState<ColumnFiltersState>([]);
  const [activeFilters, setActiveFilters] = useState<ColumnFiltersState>([]);

  // Modal State
  const [
    commentModalOpened,
    { open: openCommentModal, close: closeCommentModal },
  ] = useDisclosure(false);
  const [editingComment, setEditingComment] = useState<{
    id: number;
    text: string;
  } | null>(null);

  // Helper Filters
  const setInputFilterValue = (
    id: string,
    value: string | undefined | null
  ) => {
    setInputFilters((prev) => {
      const existing = prev.filter((f) => f.id !== id);
      if (!value) return existing;
      return [...existing, { id, value }];
    });
  };

  const getInputFilterValue = (id: string) => {
    return (inputFilters.find((f) => f.id === id)?.value as string) || "";
  };

  const handleApplyFilters = () => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    setActiveFilters(inputFilters);
  };

  const handleClearFilters = () => {
    setInputFilters([]);
    setActiveFilters([]);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  // 1. Fetch Data (Server Side)
  const { data, isLoading, isError, error } = usePurchasingTable({
    pagination,
    columnFilters: activeFilters,
    sorting,
  });

  const tableData = (data?.data as unknown as PurchasingTableView[]) || [];
  const totalCount = data?.count || 0;
  const pageCount = Math.ceil(totalCount / pagination.pageSize);

  // 2. Mutation (Updates logic remains similar, but invalidates new view key)
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const { error } = await supabase
        .from("purchase_tracking")
        .update(updates)
        .eq("purchase_check_id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchasing_table_view"] });
      notifications.show({
        title: "Updated",
        message: "Saved successfully",
        color: "green",
      });
      closeCommentModal();
    },
    onError: (err: any) => {
      notifications.show({
        title: "Error",
        message: err.message,
        color: "red",
      });
    },
  });

  const handleSaveComment = () => {
    if (!editingComment) return;
    updateMutation.mutate({
      id: editingComment.id,
      updates: { purchasing_comments: editingComment.text },
    });
  };

  // 3. Columns
  const columnHelper = createColumnHelper<PurchasingTableView>();

  const createStatusColumn = (
    keyPrefix: "doors" | "glass" | "handles" | "acc",
    headerTitle: string
  ) =>
    columnHelper.accessor(`${keyPrefix}_received_at` as any, {
      id: keyPrefix,
      header: headerTitle,
      size: 100,
      cell: (info) => {
        const row = info.row.original;
        // Access fields safely from the view type
        const ordKey = `${keyPrefix}_ordered_at` as keyof PurchasingTableView;
        const recKey = `${keyPrefix}_received_at` as keyof PurchasingTableView;

        // Logic for "Needs Ordering" tooltip
        const isDoorColumn = keyPrefix === "doors";
        // Check if style exists but is NOT made in house
        const showWarning =
          isDoorColumn && row.door_style_name && !row.door_made_in_house;

        return (
          <Box style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <StatusCell
              label={headerTitle}
              orderedAt={row[ordKey] as string}
              receivedAt={row[recKey] as string}
              onUpdate={(type, val) => {
                if (row.purchase_check_id === null) return;
                const field = type === "ordered" ? ordKey : recKey;
                updateMutation.mutate({
                  id: row.purchase_check_id,
                  updates: { [field]: val },
                });
              }}
            />
            {showWarning && (
              <Tooltip label="Needs Ordering (Outsourced)">
                <GrEmergency size={10} color="#ff0000ff" />
              </Tooltip>
            )}
          </Box>
        );
      },
    });

  const columns = [
    columnHelper.accessor("job_number", {
      header: "Job #",
      size: 120,
      cell: (info) => (
        <Text fw={600} size="sm">
          {info.getValue()}
        </Text>
      ),
    }),
    columnHelper.accessor("client_name", {
      header: "Client",
      size: 150,
      cell: (info) => <Text size="sm">{info.getValue() || "—"}</Text>,
    }),
    columnHelper.accessor("ship_schedule", {
      header: "Ship Date",
      size: 130,
      cell: (info) => {
        const date = info.getValue();
        if (!date)
          return (
            <Text c="orange" size="sm">
              TBD
            </Text>
          );
        return <Text size="sm">{dayjs(date).format("YYYY-MM-DD")}</Text>;
      },
    }),
    createStatusColumn("doors", "Doors"),
    createStatusColumn("glass", "Glass"),
    createStatusColumn("handles", "Handles"),
    createStatusColumn("acc", "Accessories"),
    columnHelper.accessor("purchasing_comments", {
      header: "Comments",
      size: 200,
      cell: (info) => (
        <Box
          onClick={() => {
            if (info.row.original.purchase_check_id === null) return;
            setEditingComment({
              id: info.row.original.purchase_check_id,
              text: info.getValue() || "",
            });
            openCommentModal();
          }}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            minHeight: "24px",
          }}
        >
          <Text size="xs" truncate c="dimmed" style={{ flex: 1 }}>
            {info.getValue() || "—"}
          </Text>
          <FaPencilAlt size={10} color="#adb5bd" style={{ opacity: 0.5 }} />
        </Box>
      ),
    }),
  ];

  // 4. Table Instance
  const table = useReactTable({
    data: tableData,
    columns,
    pageCount: pageCount,
    state: { pagination, sorting, columnFilters: activeFilters },
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <Center h={400}>
        <Loader />
      </Center>
    );
  }

  if (isError) {
    return (
      <Center h={400}>
        <Text c="red">{(error as any)?.message}</Text>
      </Center>
    );
  }

  return (
    <Box
      p={rem(20)}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 45px)",
      }}
    >
      <Group mb="md">
        <ThemeIcon
          size={50}
          radius="md"
          variant="gradient"
          gradient={{ from: "#8E2DE2", to: "#4A00E0", deg: 135 }}
        >
          <FaShoppingBag size={26} />
        </ThemeIcon>
        <Stack gap={0}>
          <Title order={2} style={{ color: "#343a40" }}>
            Purchase Tracking
          </Title>
          <Text size="sm" c="dimmed">
            Track purchase orders
          </Text>
        </Stack>
      </Group>

      {/* FILTERS */}
      <Accordion variant="contained" radius="md" mb="md">
        <Accordion.Item value="filters">
          <Accordion.Control icon={<FaSearch size={16} />}>
            Search Filters
          </Accordion.Control>
          <Accordion.Panel>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              <TextInput
                label="Job Number"
                placeholder="Search..."
                value={getInputFilterValue("job_number")}
                onChange={(e) =>
                  setInputFilterValue("job_number", e.target.value)
                }
              />
              <TextInput
                label="Client Name"
                placeholder="Search..."
                value={getInputFilterValue("client_name")}
                onChange={(e) =>
                  setInputFilterValue("client_name", e.target.value)
                }
              />
              <DateInput
                label="Ship Date"
                placeholder="Filter by Date"
                clearable
                value={
                  getInputFilterValue("ship_schedule")
                    ? dayjs(getInputFilterValue("ship_schedule")).toDate()
                    : null
                }
                onChange={(date) => {
                  const formatted = date
                    ? dayjs(date).format("YYYY-MM-DD")
                    : undefined;
                  setInputFilterValue("ship_schedule", formatted);
                }}
                valueFormat="YYYY-MM-DD"
              />
            </SimpleGrid>
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={handleClearFilters}>
                Clear Filters
              </Button>
              <Button
                variant="filled"
                color="blue"
                leftSection={<FaSearch size={14} />}
                onClick={handleApplyFilters}
                style={{
                  background:
                    "linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)",
                }}
              >
                Apply Filters
              </Button>
            </Group>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      <ScrollArea style={{ flex: 1 }}>
        <Table striped stickyHeader highlightOnHover withColumnBorders>
          <Table.Thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <Table.Th
                    key={header.id}
                    style={{ width: header.getSize(), cursor: "pointer" }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <Group gap={4}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getIsSorted() === "asc" && <FaSortUp />}
                      {header.column.getIsSorted() === "desc" && <FaSortDown />}
                      {!header.column.getIsSorted() && (
                        <FaSort style={{ opacity: 0.2 }} />
                      )}
                    </Group>
                  </Table.Th>
                ))}
              </Table.Tr>
            ))}
          </Table.Thead>
          <Table.Tbody>
            {table.getRowModel().rows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length}>
                  <Center py="xl">
                    <Text c="dimmed">No purchasing records found.</Text>
                  </Center>
                </Table.Td>
              </Table.Tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <Table.Tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <Table.Td key={cell.id}>
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

      <Box
        style={{
          borderTop: "1px solid #eee",
          padding: "1rem",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Pagination
          total={table.getPageCount()}
          value={pagination.pageIndex + 1}
          onChange={(p) => table.setPageIndex(p - 1)}
          color="#4A00E0"
        />
      </Box>

      {/* COMMENT MODAL */}
      <Modal
        opened={commentModalOpened}
        onClose={closeCommentModal}
        title="Edit Purchasing Comments"
        centered
      >
        <Stack>
          <Text size="sm" c="dimmed">
            Add notes regarding materials, delays, or specific order details.
          </Text>
          <Textarea
            minRows={4}
            placeholder="Enter comments..."
            value={editingComment?.text || ""}
            onChange={(e) => {
              const newVal = e.currentTarget.value;
              setEditingComment((prev) =>
                prev ? { ...prev, text: newVal } : null
              );
            }}
            data-autofocus
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeCommentModal}>
              Cancel
            </Button>
            <Button
              color="purple"
              onClick={handleSaveComment}
              loading={updateMutation.isPending}
            >
              Save Comment
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
