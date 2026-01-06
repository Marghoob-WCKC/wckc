"use client";

import PlantServiceOrdersTable from "@/components/Plant/PlantServiceOrdersTable/PlantServiceOrdersTable";
import { usePermissions } from "@/hooks/usePermissions";
import { Center, Loader, Text } from "@mantine/core";

export default function Page() {
  const permissions = usePermissions();

  if (!permissions.isLoaded) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  if (!permissions.isPlant && !permissions.isAdmin) {
    return (
      <Center h="100vh">
        <Text c="red" fw={700}>
          Unauthorized Access
        </Text>
      </Center>
    );
  }

  return <PlantServiceOrdersTable />;
}
