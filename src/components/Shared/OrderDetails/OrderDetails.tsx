import { Paper, Text, Stack, Group, Badge } from "@mantine/core";
import { FaClipboardList, FaCheck, FaTimes } from "react-icons/fa";
import { Tables } from "@/types/db";

interface OrderDetailsProps {
  orderDetails: Partial<Tables<"sales_orders">> | null | undefined;
}

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) => (
  <Group justify="space-between" align="center" style={{ minHeight: "24px" }}>
    <Text size="sm" c="dimmed">
      <strong>{label}:</strong>
    </Text>
    <Text component="div" size="sm" fw={500} style={{ textAlign: "right" }}>
      {value || "—"}
    </Text>
  </Group>
);

export default function OrderDetails({ orderDetails }: OrderDetailsProps) {
  if (!orderDetails) return null;

  return (
    <Paper p="md" radius="md" shadow="sm" style={{ background: "#ffffffff" }}>
      <Text
        fw={600}
        size="lg"
        mb="md"
        c="#4A00E0"
        style={{ display: "flex", alignItems: "center" }}
      >
        <FaClipboardList style={{ marginRight: 8 }} /> Order Details
      </Text>

      <Stack gap={6}>
        <InfoRow label="Order Type" value={orderDetails.order_type} />
        <InfoRow label="Delivery Type" value={orderDetails.delivery_type} />
        <InfoRow
          label="Installation"
          value={
            orderDetails.install !== undefined &&
            orderDetails.install !== null ? (
              <Badge
                size="sm"
                variant="light"
                color={orderDetails.install ? "teal" : "gray"}
                leftSection={
                  orderDetails.install ? (
                    <FaCheck size={8} />
                  ) : (
                    <FaTimes size={8} />
                  )
                }
              >
                {orderDetails.install ? "Required" : "Not Required"}
              </Badge>
            ) : (
              "—"
            )
          }
        />
      </Stack>
    </Paper>
  );
}
