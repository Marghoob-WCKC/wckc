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
  Anchor,
  Indicator,
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

// Extend the View type with the new incomplete receipt columns
type PurchasingTableView = Views<"purchasing_table_view"> & {
  doors_received_incomplete_at: string | null;
  glass_received_incomplete_at: string | null;
  handles_received_incomplete_at: string | null;
  acc_received_incomplete_at: string | null;
};

// Data needed to process an incomplete update
type IncompleteUpdateData = {
  id: number;
  keyPrefix: "doors" | "glass" | "handles" | "acc";
  orderedAt: string | null;
  initialComment: string;
};

/**
 * StatusCell Component
 * Renders the status badge and the dropdown menu for changing status.
 */
const StatusCell = ({
  orderedAt,
  receivedAt,
  receivedIncompleteAt,
  onUpdate,
  onUpdateIncomplete,
  label,
}: {
  orderedAt: string | null;
  receivedAt: string | null;
  receivedIncompleteAt: string | null;
  onUpdate: (
    field: "ordered" | "received" | "clear",
    val: string | null
  ) => void;
  onUpdateIncomplete: () => void;
  label: string;
}) => {
  let badgeColor = "red";
  let statusText = "—";

  if (receivedIncompleteAt) {
    badgeColor = "orange";
    statusText = "Incomplete";
  } else if (receivedAt) {
    badgeColor = "green";
    statusText = "Received";
  } else if (orderedAt) {
    badgeColor = "yellow";
    statusText = "Ordered";
  }

  return (
    <Menu shadow="md" width={220} withinPortal>
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
          // Disable only if it is strictly "Ordered" (no receipt activity yet).
          // Allows resetting to "Ordered" if it was previously marked Received or Incomplete.
          disabled={!!orderedAt && !receivedAt && !receivedIncompleteAt}
        >
          Mark Ordered
        </Menu.Item>

        <Menu.Item
          leftSection={<FaCheck size={14} />}
          color="green"
          onClick={() => onUpdate("received", new Date().toISOString())}
          // FIX: Removed `!!receivedIncompleteAt` check.
          // Now allows marking as "Complete" even if currently "Incomplete".
          disabled={!!receivedAt || !orderedAt}
        >
          Mark Received Complete
        </Menu.Item>

        <Menu.Item
          leftSection={<FaCheck size={14} />}
          color="orange"
          onClick={onUpdateIncomplete}
          // Enable this even if already incomplete, so users can add sequential notes
          // (e.g., "Received 5 more, still missing 2").
          disabled={!!receivedAt || !orderedAt}
        >
          Received Incomplete
        </Menu.Item>

        <Menu.Divider />

        <Menu.Item color="red" onClick={() => onUpdate("clear", null)}>
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

  // Modal State - for general comment editing
  const [
    commentModalOpened,
    { open: openCommentModal, close: closeCommentModal },
  ] = useDisclosure(false);
  const [editingComment, setEditingComment] = useState<{
    id: number;
    text: string;
  } | null>(null);

  // Modal State - for "Received Incomplete" details
  const [
    incompleteModalOpened,
    { open: openIncompleteModal, close: closeIncompleteModal },
  ] = useDisclosure(false);
  const [incompleteUpdateData, setIncompleteUpdateData] =
    useState<IncompleteUpdateData | null>(null);
  const [incompleteDetail, setIncompleteDetail] = useState("");

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

  // 1. Fetch Data
  const { data, isLoading, isError, error } = usePurchasingTable({
    pagination,
    columnFilters: activeFilters,
    sorting,
  });

  const tableData = (data?.data as PurchasingTableView[]) || [];
  const pageCount = Math.ceil((data?.count || 0) / pagination.pageSize);

  // 2. Mutation Logic with Comment Logging
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
      isStatusChange = false,
      keyPrefix,
      initialComment,
      detail,
    }: {
      id: number;
      updates: any;
      isStatusChange?: boolean;
      keyPrefix?: string;
      initialComment?: string;
      detail?: string;
    }) => {
      let commentUpdate: string | undefined = undefined;

      // If this is a status change, we automatically append a log line to comments
      if (isStatusChange && keyPrefix) {
        const timestamp = dayjs().format("YYYY-MM-DD HH:mm");
        const statusField = Object.keys(updates).find(
          (k) => updates[k] !== undefined && updates[k] !== null
        );

        let newCommentLine = "";

        // Determine log message based on field update
        if (statusField?.endsWith("ordered_at") && updates[statusField]) {
          newCommentLine = `${keyPrefix.toUpperCase()} Ordered at: [${timestamp}]`;
        } else if (
          statusField?.endsWith("received_at") &&
          updates[statusField]
        ) {
          newCommentLine = `${keyPrefix.toUpperCase()} Received fully at: [${timestamp}]`;
        } else if (
          statusField?.endsWith("received_incomplete_at") &&
          updates[statusField]
        ) {
          // Incomplete logic includes detail
          newCommentLine = `${keyPrefix.toUpperCase()} Received partially at: [${timestamp}] - ${
            detail || "No detail provided"
          }`;
        } else if (Object.values(updates).every((val) => val === null)) {
          newCommentLine = `${keyPrefix.toUpperCase()} Status Cleared at: [${timestamp}]`;
        }

        // Append log line
        if (newCommentLine) {
          commentUpdate = initialComment
            ? `${initialComment}\n${newCommentLine}`
            : newCommentLine;

          updates.purchasing_comments = commentUpdate;
        }
      }

      // Perform the update
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
        message: "Status and comments updated successfully",
        color: "green",
      });
      // Reset Modals
      closeCommentModal();
      closeIncompleteModal();
      setIncompleteDetail("");
    },
    onError: (err: any) => {
      notifications.show({
        title: "Error",
        message: err.message,
        color: "red",
      });
    },
  });

  // Save manual comment edit
  const handleSaveComment = () => {
    if (!editingComment) return;
    updateMutation.mutate({
      id: editingComment.id,
      updates: { purchasing_comments: editingComment.text },
      isStatusChange: false,
    });
  };

  // Open "Received Incomplete" modal
  const handleIncompleteReceipt = (
    row: PurchasingTableView,
    keyPrefix: "doors" | "glass" | "handles" | "acc"
  ) => {
    if (row.purchase_check_id === null) return;

    setIncompleteUpdateData({
      id: row.purchase_check_id,
      keyPrefix,
      orderedAt: row[`${keyPrefix}_ordered_at`] as string | null,
      initialComment: row.purchasing_comments || "",
    });

    openIncompleteModal();
  };

  // Submit "Received Incomplete" status
  const submitIncompleteReceipt = () => {
    if (!incompleteUpdateData) return;

    const { id, keyPrefix, initialComment } = incompleteUpdateData;

    // DB Column Names
    const incompleteField = `${keyPrefix}_received_incomplete_at`;
    const completeField = `${keyPrefix}_received_at`;
    const orderedField = `${keyPrefix}_ordered_at`;

    const updates: any = {};
    // Set incomplete timestamp
    updates[incompleteField] = new Date().toISOString();
    // Ensure complete timestamp is cleared (cannot be both)
    updates[completeField] = null;

    // Consistency: If not marked ordered yet, mark it ordered now
    if (!incompleteUpdateData.orderedAt) {
      updates[orderedField] = new Date().toISOString();
    }

    updateMutation.mutate({
      id,
      updates,
      isStatusChange: true,
      keyPrefix,
      initialComment,
      detail: incompleteDetail,
    });
  };

  // 3. Table Column Definitions
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

        const ordKey = `${keyPrefix}_ordered_at` as keyof PurchasingTableView;
        const recKey = `${keyPrefix}_received_at` as keyof PurchasingTableView;
        const incKey =
          `${keyPrefix}_received_incomplete_at` as keyof PurchasingTableView;

        // General Status Update Handler
        const handleUpdate = (
          type: "ordered" | "received" | "clear",
          val: string | null
        ) => {
          if (row.purchase_check_id === null) return;

          let updates: any = {};

          if (type === "ordered") {
            // Setting Ordered clears any received status (reset flow)
            updates = {
              [ordKey]: val,
              [recKey]: null,
              [incKey]: null,
            };
          } else if (type === "received") {
            // Setting Received Complete clears incomplete status
            updates = {
              [recKey]: val,
              [incKey]: null,
            };
          } else if (type === "clear") {
            // Clear all
            updates = {
              [ordKey]: null,
              [recKey]: null,
              [incKey]: null,
            };
          }

          updateMutation.mutate({
            id: row.purchase_check_id,
            updates,
            isStatusChange: true,
            keyPrefix,
            initialComment: row.purchasing_comments || "",
          });
        };

        const isDoorColumn = keyPrefix === "doors";
        const showWarning =
          isDoorColumn && row.door_style_name && !row.door_made_in_house;

        return (
          <Box style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {showWarning ? (
              <Indicator inline processing color="red" size={8} w={"100%"}>
                <StatusCell
                  label={headerTitle}
                  orderedAt={row[ordKey] as string}
                  receivedAt={row[recKey] as string}
                  receivedIncompleteAt={row[incKey] as string}
                  onUpdate={handleUpdate}
                  onUpdateIncomplete={() =>
                    handleIncompleteReceipt(row, keyPrefix)
                  }
                />
              </Indicator>
            ) : (
              <StatusCell
                label={headerTitle}
                orderedAt={row[ordKey] as string}
                receivedAt={row[recKey] as string}
                receivedIncompleteAt={row[incKey] as string}
                onUpdate={handleUpdate}
                onUpdateIncomplete={() =>
                  handleIncompleteReceipt(row, keyPrefix)
                }
              />
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
          <Anchor
            href={`/dashboard/sales/editsale/${info.row.original.sales_order_id}`}
            style={{ color: "#6100bbff", fontWeight: "bold" }}
            onClick={(e) => e.stopPropagation()}
          >
            {info.getValue()}
          </Anchor>
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
      header: "History",
      // IMPORTANT: Define a size so fixed layout knows how wide to make this
      size: 250,
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
            // Crucial for text truncation in Flexbox:
            maxWidth: "100%",
          }}
        >
          <Tooltip
            label={info.getValue()}
            multiline
            w={300}
            withinPortal
            disabled={!info.getValue()}
          >
            <Text
              size="xs"
              truncate // This adds the '...'
              c="dimmed"
              style={{ flex: 1 }}
            >
              {info.getValue() || "—"}
            </Text>
          </Tooltip>
          <FaPencilAlt
            size={10}
            color="#adb5bd"
            style={{ opacity: 0.5, flexShrink: 0 }}
          />
        </Box>
      ),
    }),
  ];

  // 4. React Table Instance
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
      {/* HEADER */}
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

      {/* TABLE CONTENT */}
      <ScrollArea style={{ flex: 1 }}>
        <Table
          striped
          stickyHeader
          highlightOnHover
          withColumnBorders
          layout="fixed"
        >
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

      {/* PAGINATION */}
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

      {/* MODAL 1: General Comments */}
      <Modal
        opened={commentModalOpened}
        onClose={closeCommentModal}
        title="Edit Purchasing Comments"
        centered
      >
        <Stack>
          <Text size="sm" c="dimmed">
            Edit full comment history manually.
          </Text>
          <Textarea
            minRows={12}
            placeholder="Enter comments..."
            styles={{ input: { minHeight: "200px" } }}
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

      {/* MODAL 2: Received Incomplete Detail */}
      <Modal
        opened={incompleteModalOpened}
        onClose={closeIncompleteModal}
        title={`Incomplete Receipt: ${
          incompleteUpdateData?.keyPrefix.toUpperCase() || "ITEM"
        }`}
        centered
      >
        <Stack>
          <Text size="sm" c="red" fw={500}>
            Action Required: Provide details about the missing items.
          </Text>
          <Text size="xs" c="dimmed">
            This note will be automatically logged in the comments field with a
            timestamp.
          </Text>
          <Textarea
            minRows={3}
            label="Missing / Damaged Details"
            placeholder="e.g. Missing 5 door fronts, 1 drawer box damaged..."
            value={incompleteDetail}
            onChange={(e) => setIncompleteDetail(e.currentTarget.value)}
            data-autofocus
            withAsterisk
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeIncompleteModal}>
              Cancel
            </Button>
            <Button
              color="orange"
              onClick={submitIncompleteReceipt}
              loading={updateMutation.isPending}
              disabled={!incompleteDetail.trim()}
            >
              Log Incomplete Receipt
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
