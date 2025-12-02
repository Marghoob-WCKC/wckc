"use client";

import EditSale from "@/components/Sales/EditSale/EditSale";
import ReadOnlySale from "@/components/Sales/ReadOnlySale/ReadOnlySale";
import { useUser } from "@clerk/nextjs";
import { Center, Loader } from "@mantine/core";
import { useParams } from "next/navigation";

export default function EditSalePage() {
  const params = useParams();
  const { user, isLoaded } = useUser();
  const salesOrderId = Number(params.id);
  if (!isLoaded) {
    return (
      <Center h="100vh">
        <Loader color="violet" />
      </Center>
    );
  }

  const role = user?.publicMetadata?.role as string | undefined;

  const canEdit = role === "admin" || role === "designer";

  if (canEdit) {
    return <EditSale salesOrderId={salesOrderId} />;
  }

  return <ReadOnlySale salesOrderId={salesOrderId} />;
}
