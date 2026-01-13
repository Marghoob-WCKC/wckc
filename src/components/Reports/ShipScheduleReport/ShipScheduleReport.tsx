"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Views } from "@/types/db";
import {
  ShippingReportPdf,
  ShippingReportJob,
} from "@/documents/ShippingReportPdf";
import dynamic from "next/dynamic";
import {
  Loader,
  Center,
  Group,
  Title,
  Text,
  Stack,
  ThemeIcon,
  Container,
  Paper,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { FaShippingFast } from "react-icons/fa";
import dayjs from "dayjs";
import { useSupabase } from "@/hooks/useSupabase";
import { colors } from "@/theme";
import { formatShipScheduleData } from "@/utils/reportFormatters";

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

export default function ShipScheduleReport() {
  const { supabase, isAuthenticated } = useSupabase();
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    dayjs().subtract(1, "day").toDate(),
    dayjs().add(7, "day").toDate(),
  ]);

  const {
    data: reportData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["ship_schedule_report", dateRange],
    queryFn: async () => {
      if (!dateRange[0] || !dateRange[1]) return [];

      const startDate = dayjs(dateRange[0]).format("YYYY-MM-DD");
      const endDate = dayjs(dateRange[1]).format("YYYY-MM-DD");

      const { data, error } = await supabase
        .from("plant_table_view")
        .select("*")
        .gte("ship_schedule", startDate)
        .lte("ship_schedule", endDate)
        .not("ship_schedule", "is", null)
        .order("ship_schedule", { ascending: true });

      if (error) throw error;
      return data as Views<"plant_table_view">[];
    },
    enabled: isAuthenticated && !!dateRange[0] && !!dateRange[1],
  });

  const formattedData: ShippingReportJob[] = useMemo(() => {
    return formatShipScheduleData(reportData || []);
  }, [reportData]);

  const memoizedPreview = useMemo(
    () => (
      <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
        <ShippingReportPdf
          data={formattedData}
          startDate={dateRange[0]}
          endDate={dateRange[1]}
        />
      </PDFViewer>
    ),
    [formattedData, dateRange]
  );

  return (
    <Container size="100%" p="md">
      <Stack gap="lg">
        <Paper p="md" radius="md" shadow="sm" bg="white">
          <Group justify="space-between" align="flex-end">
            <Group>
              <ThemeIcon
                size={50}
                radius="md"
                variant="gradient"
                gradient={{ from: "#8E2DE2", to: "#4A00E0", deg: 135 }}
              >
                <FaShippingFast size={26} />
              </ThemeIcon>
              <Stack gap={0}>
                <Title order={2} style={{ color: "#343a40" }}>
                  Shipping Schedule Report
                </Title>
                <Text size="sm" c="dimmed">
                  Generate PDF report by ship schedule date range.
                </Text>
              </Stack>
            </Group>
            <Group align="flex-end">
              <DatePickerInput
                type="range"
                allowSingleDateInRange
                label="Report Date Range"
                placeholder="Select dates"
                value={dateRange}
                onChange={(val) =>
                  setDateRange(val as [Date | null, Date | null])
                }
                style={{ width: 300 }}
                clearable={false}
              />
            </Group>
          </Group>
        </Paper>

        <Paper
          shadow="md"
          p={0}
          radius="md"
          style={{
            height: "calc(100vh - 200px)",
            overflow: "hidden",
            border: `1px solid ${colors.gray?.border || "#e0e0e0"}`,
          }}
        >
          {!dateRange[0] || !dateRange[1] ? (
            <Center h="100%">
              <Text c="dimmed">
                Please select a date range to view the report.
              </Text>
            </Center>
          ) : isLoading ? (
            <Center h="100%">
              <Loader type="bars" size="xl" color="violet" />
            </Center>
          ) : isError ? (
            <Center h="100%">
              <Text c="red">
                Error generating report: {(error as Error).message}
              </Text>
            </Center>
          ) : formattedData.length > 0 ? (
            memoizedPreview
          ) : (
            <Center h="100%">
              <Stack align="center" gap="xs">
                <ThemeIcon color="violet" variant="light" size={60} radius="xl">
                  <FaShippingFast size={30} />
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
