"use client";

import { useState, useMemo } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import { usePlantShippingTable } from "@/hooks/usePlantShippingTable";
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
import { FaShippingFast, FaCalendarCheck } from "react-icons/fa";
import dayjs from "dayjs";
import { useSupabase } from "@/hooks/useSupabase";
import { ColumnFiltersState } from "@tanstack/react-table";
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
  const { isAuthenticated } = useSupabase();
  const [pickerDates, setPickerDates] = useState<[Date | null, Date | null]>([
    dayjs().subtract(1, "day").toDate(),
    dayjs().add(7, "day").toDate(),
  ]);
  const [reportDates] = useDebouncedValue(pickerDates, 800);

  const activeFilters: ColumnFiltersState = useMemo(() => {
    if (reportDates[0] && reportDates[1]) {
      return [{ id: "ship_date_range", value: reportDates }];
    }
    return [];
  }, [reportDates]);

  const { data, isLoading, isError } = usePlantShippingTable({
    pagination: { pageIndex: 0, pageSize: 1000 },
    columnFilters: activeFilters,
    sorting: [{ id: "ship_schedule", desc: false }],
  });

  const tableData = (data?.data as Views<"plant_table_view">[]) || [];

  const formattedData: ShippingReportJob[] = useMemo(() => {
    return formatShipScheduleData(tableData);
  }, [tableData]);

  const memoizedPreview = useMemo(
    () => (
      <PDFViewer
        key={Math.random()}
        style={{ width: "100%", height: "100%", border: "none" }}
      >
        <ShippingReportPdf
          data={formattedData}
          startDate={reportDates[0]}
          endDate={reportDates[1]}
        />
      </PDFViewer>
    ),
    [formattedData, reportDates]
  );

  if (!isAuthenticated || isLoading) {
    return (
      <Center h="100vh">
        <Loader size="xl" />
      </Center>
    );
  }

  if (isError) {
    return (
      <Center h="100vh">
        <Text c="red">Error loading data.</Text>
      </Center>
    );
  }

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
                  Printable PDF view of the shipping schedule
                </Text>
              </Stack>
            </Group>
            <Group>
              <DatePickerInput
                type="range"
                allowSingleDateInRange
                placeholder="Pick dates range"
                value={pickerDates}
                onChange={(val) =>
                  setPickerDates(val as [Date | null, Date | null])
                }
                clearable
                leftSection={<FaCalendarCheck size={14} />}
                w={300}
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
          {formattedData.length > 0 ? (
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
