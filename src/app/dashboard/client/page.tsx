"use client";

import ClientForm from "@/components/Clients/ClientForm/ClientForm";
import ClientsTable from "@/components/Clients/ClientTable/ClientTable";

import { Modal, Button } from "@mantine/core";
import { useState } from "react";

export default function ClientsPage() {
  const [modalOpened, setModalOpened] = useState(false);
  return (
    <div className="p-8 space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-semibold">All Clients</h1>
        <Button onClick={() => setModalOpened(true)}>Add Client</Button>
      </div>
      <ClientsTable />
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        size="xl"
        centered
      >
        <ClientForm />
      </Modal>
    </div>
  );
}
