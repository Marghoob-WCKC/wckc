"use client";

import { useState, useMemo, useEffect } from "react";
import { usePlantWrapTable } from "@/hooks/usePlantWrapTable";
import { Views } from "@/types/db";
import {
  WrapSchedulePdf,
  ShippingReportJob,
} from "@/documents/WrapSchedulePdf";
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
import { FaCalendarAlt } from "react-icons/fa";
import dayjs from "dayjs";
import { useSupabase } from "@/hooks/useSupabase";
import { ColumnFiltersState } from "@tanstack/react-table";
import { colors } from "@/theme";
import { formatWrapScheduleData } from "@/utils/reportFormatters";

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

export default function WrapScheduleReport() {
  const { isAuthenticated } = useSupabase();
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    dayjs().subtract(1, "day").toDate(),
    dayjs().add(7, "day").toDate(),
  ]);

  const activeFilters: ColumnFiltersState = useMemo(() => {
    if (dateRange[0] && dateRange[1]) {
      return [{ id: "wrap_date_range", value: dateRange }];
    }
    return [];
  }, [dateRange]);

  const { data, isLoading, isError } = usePlantWrapTable({
    pagination: { pageIndex: 0, pageSize: 1000 },
    columnFilters: activeFilters,
    sorting: [{ id: "wrap_date", desc: false }],
  });

  const tableData = (data?.data as Views<"plant_table_view">[]) || [];

  const formattedData: ShippingReportJob[] = useMemo(() => {
    return formatWrapScheduleData(tableData);
  }, [tableData]);

  const memoizedPreview = useMemo(
    () => (
      <PDFViewer style={{ width: "100%", height: "100%", border: "none" }}>
        <WrapSchedulePdf
          data={formattedData}
          startDate={dateRange[0]}
          endDate={dateRange[1]}
        />
      </PDFViewer>
    ),
    [formattedData, dateRange]
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
                <FaCalendarAlt size={26} />
              </ThemeIcon>
              <Stack gap={0}>
                <Title order={2} style={{ color: "#343a40" }}>
                  Wrap Schedule Report
                </Title>
                <Text size="sm" c="dimmed">
                  Printable PDF view of the wrap schedule
                </Text>
              </Stack>
            </Group>
            <Group>
              <DatePickerInput
                type="range"
                allowSingleDateInRange
                placeholder="Pick dates range"
                value={dateRange}
                onChange={(val) =>
                  setDateRange(val as [Date | null, Date | null])
                }
                clearable
                leftSection={<FaCalendarAlt size={14} />}
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
                  <FaCalendarAlt size={30} />
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
