"use client";

import { Modal, Loader, Center } from "@mantine/core";
import dynamic from "next/dynamic";
import { Database } from "@/types/supabase";
import { ServiceOrdersPdf } from "@/documents/ServiceOrdersPdf";
import { useMemo } from "react";

type PlantServiceOrderView =
  Database["public"]["Views"]["plant_service_orders_view"]["Row"];

const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <Center h={400}>
        <Loader color="violet" />
      </Center>
    ),
  }
);

interface ServiceOrderPdfPreviewModalProps {
  opened: boolean;
  onClose: () => void;
  data: PlantServiceOrderView[];
  dateRange: [Date | null, Date | null];
}

export default function ServiceOrderPdfPreviewModal({
  opened,
  onClose,
  data,
  dateRange,
}: ServiceOrderPdfPreviewModalProps) {
  const memoizedPreview = useMemo(
    () => (
      <PDFViewer style={{ width: "100%", height: "100%", border: "none" }}>
        <ServiceOrdersPdf
          data={data}
          startDate={dateRange[0]}
          endDate={dateRange[1]}
        />
      </PDFViewer>
    ),
    [data, dateRange]
  );
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Service Orders Preview"
      fullScreen
      styles={{ body: { height: "calc(100vh - 60px)", padding: 0 } }}
    >
      {memoizedPreview}
    </Modal>
  );
}
