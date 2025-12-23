"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Paper,
  Group,
  Text,
  Button,
  Stack,
  Title,
  ThemeIcon,
  Container,
  Center,
  Loader,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { FaFileInvoice, FaSync, FaCalendarAlt } from "react-icons/fa";
import dayjs from "dayjs"; // Make sure to import dayjs

import { useShippedNotInvoiced } from "@/hooks/useShippedNotInvoiced";
import { ShippedNotInvoicedPdf } from "@/documents/ShippedNotInvoiced";
import { colors } from "@/theme";
import "@mantine/dates/styles.css";

// Dynamic import for the PDF Viewer to avoid SSR issues
const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <Center h="100%">
        <Loader color="violet" />
      </Center>
    ),
  }
);

export default function ShippedNotInvoicedReport() {
  // 1. Initialize State with Default Range (Current Year)
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    dayjs().startOf("year").toDate(),
    dayjs().endOf("year").toDate(),
  ]);

  // 2. Separate state for the hook to prevent partial updates
  // This effectively "buffers" the input so the query doesn't run while typing/picking
  const [queryRange, setQueryRange] =
    useState<[Date | null, Date | null]>(dateRange);

  // 3. Logic: Only update the queryRange when the input is "Complete" or "Cleared"
  useEffect(() => {
    const [start, end] = dateRange;
    // Update if:
    // a) Both dates are present (Valid range)
    // b) Both dates are null (Cleared filter)
    if ((start && end) || (!start && !end)) {
      setQueryRange(dateRange);
    }
    // If only 'start' is present (user is currently picking 'end'), do nothing.
  }, [dateRange]);

  // 4. Pass the 'queryRange' (the safe, complete one) to the hook
  const {
    data: reportData,
    isLoading,
    isError,
    error,
  } = useShippedNotInvoiced(queryRange);

  return (
    <Container size="100%" p="md">
      <Stack gap="lg">
        {/* Header Section with Filter and Actions */}
        <Paper p="md" radius="md" shadow="sm" bg="white">
          <Group justify="space-between" align="flex-end">
            <Group>
              <ThemeIcon
                size={50}
                radius="md"
                variant="gradient"
                gradient={{
                  from: colors.red.primary,
                  to: colors.red.secondary,
                  deg: 135,
                }}
              >
                <FaFileInvoice size={26} />
              </ThemeIcon>
              <Stack gap={0}>
                <Title order={2} style={{ color: colors.gray.title }}>
                  Shipped & Not Invoiced
                </Title>
                <Text size="sm" c="dimmed">
                  Jobs marked as shipped but missing invoice records
                </Text>
              </Stack>
            </Group>

            <DatePickerInput
              type="range"
              label="Filter by Ship Date"
              placeholder="Select date range"
              value={dateRange}
              onChange={(value) =>
                setDateRange(value as [Date | null, Date | null])
              }
              leftSection={
                <FaCalendarAlt size={16} color={colors.violet.primary} />
              }
              clearable
            />
          </Group>
        </Paper>

        {/* PDF Viewer Section */}
        <Paper
          shadow="md"
          p={0}
          radius="md"
          style={{
            height: "calc(100vh - 200px)",
            overflow: "hidden",
            border: `1px solid ${colors.gray.border}`,
          }}
        >
          {isLoading ? (
            <Center h="100%">
              <Loader type="bars" size="xl" color="violet" />
            </Center>
          ) : isError ? (
            <Center h="100%">
              <Text c="red">
                Error loading report: {(error as Error).message}
              </Text>
            </Center>
          ) : reportData && reportData.length > 0 ? (
            <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
              <ShippedNotInvoicedPdf data={reportData} />
            </PDFViewer>
          ) : (
            <Center h="100%">
              <Stack align="center" gap="xs">
                <ThemeIcon color="green" variant="light" size={60} radius="xl">
                  <FaFileInvoice size={30} />
                </ThemeIcon>
                <Text size="lg" fw={500} c="dimmed">
                  No records found for this period.
                </Text>
              </Stack>
            </Center>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}
