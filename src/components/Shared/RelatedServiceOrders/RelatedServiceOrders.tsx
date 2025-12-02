"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Paper,
  Group,
  Text,
  Button,
  Table,
  Badge,
  Tooltip,
  ActionIcon,
  Center,
  Accordion,
} from "@mantine/core";
import { FaTools, FaPlus, FaEye, FaChevronDown } from "react-icons/fa";
import dayjs from "dayjs";
import { useSupabase } from "@/hooks/useSupabase";
import { Tables } from "@/types/db";

interface RelatedServiceOrdersProps {
  jobId: number | null | undefined;
}

export default function RelatedServiceOrders({
  jobId,
}: RelatedServiceOrdersProps) {
  const { supabase, isAuthenticated } = useSupabase();
  const router = useRouter();

  const { data: relatedServiceOrders } = useQuery({
    queryKey: ["related-service-orders", jobId],
    queryFn: async () => {
      if (!jobId) return [];
      const { data, error } = await supabase
        .from("service_orders")
        .select("*")
        .eq("job_id", jobId)
        .order("date_entered", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated && !!jobId,
  });

  if (!jobId) return null;

  // Helper to render table rows to ensure consistency between the main list and accordion
  const renderRows = (orders: Tables<"service_orders">[]) => {
    return orders.map((so) => (
      <Table.Tr key={so.service_order_id}>
        <Table.Td>
          <Text fw={500} size="sm">
            {so.service_order_number}
          </Text>
        </Table.Td>
        <Table.Td>{dayjs(so.date_entered).format("YYYY-MM-DD")}</Table.Td>
        <Table.Td>
          {so.completed_at ? (
            <Badge color="green" variant="light">
              Completed
            </Badge>
          ) : (
            <Badge color="blue" variant="light">
              Open
            </Badge>
          )}
        </Table.Td>
        <Table.Td>
          <Tooltip label="View Details">
            <ActionIcon
              variant="subtle"
              color="blue"
              onClick={() =>
                router.push(`/dashboard/serviceorders/${so.service_order_id}`)
              }
            >
              <FaEye />
            </ActionIcon>
          </Tooltip>
        </Table.Td>
      </Table.Tr>
    ));
  };

  // Slice data for display
  const visibleOrders = relatedServiceOrders?.slice(0, 3) || [];
  const hiddenOrders = relatedServiceOrders?.slice(3) || [];

  return (
    <Paper p="md" radius="md" shadow="sm" withBorder bg={"gray.1"}>
      <Paper p="md" radius="md" bg={"white"}>
        <Group mb="md">
          <FaTools size={18} color="#4A00E0" />
          <Text fw={600} size="lg">
            Related Service Orders
          </Text>
          <Button
            size="xs"
            variant="light"
            leftSection={<FaPlus size={10} />}
            onClick={() => router.push(`/dashboard/serviceorders/new`)}
            style={{
              background: "linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)",
              color: "white",
              border: "none",
            }}
          >
            New Service Order
          </Button>
        </Group>

        {relatedServiceOrders && relatedServiceOrders.length > 0 ? (
          <>
            {/* Always visible table (First 3 items) */}
            <Table striped highlightOnHover withTableBorder bg="white">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>SO #</Table.Th>
                  <Table.Th>Date Entered</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Action</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{renderRows(visibleOrders)}</Table.Tbody>
            </Table>

            {/* Accordion for the remaining items */}
            {hiddenOrders.length > 0 && (
              <Accordion
                variant="contained"
                radius="md"
                mt="sm"
                styles={{
                  control: {},
                  label: { fontWeight: 500, color: "#4A00E0" },
                  item: {
                    border: "1px solid #dee2e6",
                    backgroundColor: "white",
                  },
                  content: { padding: 0 },
                }}
              >
                <Accordion.Item value="more-orders">
                  <Accordion.Control>
                    View {hiddenOrders.length} older service orders
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Table striped highlightOnHover>
                      <Table.Tbody>{renderRows(hiddenOrders)}</Table.Tbody>
                    </Table>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            )}
          </>
        ) : (
          <Center p="sm" bg="white" style={{ borderRadius: "8px" }}>
            <Text c="dimmed" size="sm">
              No service orders found for this job.
            </Text>
          </Center>
        )}
      </Paper>
    </Paper>
  );
}
