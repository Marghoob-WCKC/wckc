"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useForm } from "@mantine/form";
import { zodResolver } from "@/utils/zodResolver/zodResolver";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import {
  Container,
  Button,
  Group,
  Stack,
  TextInput,
  NumberInput,
  Select,
  Text,
  SimpleGrid,
  Fieldset,
  Paper,
  Switch,
  Loader,
  Center,
  Badge,
  Divider,
  Box,
  Title,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { FaPlus, FaCopy, FaCheckCircle } from "react-icons/fa";
import { useSupabase } from "@/hooks/useSupabase";
import {
  MasterOrderInput,
  MasterOrderSchema,
} from "@/zod/salesOrder_Cabinets_Jobs.schema";
import { ClientType } from "@/zod/client.schema";
import AddClient from "@/components/Clients/AddClient/AddClient";
import { useJobNumbers } from "@/hooks/useJobNumbers";

export default function NewSalesOrderPage() {
  const { supabase, isAuthenticated } = useSupabase();
  const { user } = useUser();
  const { data: jobBaseOptions, isLoading: jobsLoading } =
    useJobNumbers(isAuthenticated);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedClientData, setSelectedClientData] =
    useState<ClientType | null>(null);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);

  const [successBannerData, setSuccessBannerData] = useState<{
    jobNum: string;
  } | null>(null);
  const [parentBaseSelection, setParentBaseSelection] = useState<string | null>(
    null
  );

  const {
    data: clientsData,
    isLoading: clientsLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["clients-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client")
        .select(
          "id, firstName, lastName, street, city, province, zip, phone1, email1, phone2, email2"
        )
        .order("lastName");
      if (error) throw error;
      return data as ClientType[];
    },
    enabled: isAuthenticated,
  });
  type ClientSelectOption = {
    value: string;
    label: string;
    original: ClientType;
  };
  type JobResult = {
    out_job_id: number; // bigint from DB
    out_job_suffix: string | null; // text from DB
    out_job_base_number: number; // int from DB
    out_job_number: string; // text (the calculated full job number)
  };
  const clientSelectOptions = useMemo(() => {
    const safeClients = clientsData || [];

    return safeClients.map((c) => {
      const clientItem = c as ClientType;

      return {
        value: String(clientItem.id),
        label: clientItem.lastName,
        original: clientItem,
      };
    });
  }, [clientsData]);

  const form = useForm<MasterOrderInput>({
    initialValues: {
      client_id: 0,
      stage: "QUOTE",

      total: 0,
      deposit: 0,
      install: false,
      comments: "",
      order_type: "",
      delivery_type: "",
      cabinet: {
        species: "",
        color: "",
        door_style: "",
        finish: "",
        glaze: "",
        top_drawer_front: "",
        interior: "",
        drawer_hardware: "",
        box: "",
        piece_count: "",
        glass_type: "",

        hinge_soft_close: false,
        doors_parts_only: false,
        handles_supplied: false,
        handles_selected: false,
        glass: false,
      },
      shipping: {
        shipping_client_name: "",
        shipping_street: "",
        shipping_city: "",
        shipping_province: "",
        shipping_zip: "",
        shipping_phone_1: "",
        shipping_phone_2: "",
        shipping_email_1: "",
        shipping_email_2: "",
      },
      checklist: {
        layout_date: null,
        client_meeting_date: null,
        follow_up_date: null,
        appliance_specs_date: null,
        selections_date: null,
        markout_date: null,
        review_date: null,
        second_markout_date: null,
        flooring_type: "",
        flooring_clearance: "",
      },
    },
    validate: zodResolver(MasterOrderSchema),
  });

  // Inside NewSalesOrderPage.tsx

  // Inside NewSalesOrderPage.tsx

  const submitMutation = useMutation({
    mutationFn: async (values: MasterOrderInput) => {
      // --- 1. DESTRUCTURING AND AUTH CHECK ---
      if (!user) throw new Error("User not authenticated");

      const {
        client_id,
        stage,
        total,
        deposit,
        comments,
        install,
        order_type,
        delivery_type,
        cabinet,
        shipping,
        checklist,
        // parent_job_number_input is handled via state/prop, but we destructure for clarity if it existed here
      } = values;

      // --- 2. SEQUENCE INSERTS (SO is created first) ---
      let prefix = "Q";

      // A. Insert Cabinet Specs
      const { data: cabinetResult, error: cabError } = await supabase
        .from("cabinets")
        .insert(cabinet)
        .select("id")
        .single();

      if (cabError) throw new Error(`Cabinet Error: ${cabError.message}`);
      const cabinetId = cabinetResult.id;

      // B. Generate Sales Order Number (Prefix-YYMM-UniqueID)
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, "0");

      const uniqueIdPortion = cabinetId;
      prefix = stage === "SOLD" ? "S" : "Q"; // Determine prefix based on stage
      const salesOrderNum = `${prefix}-${year}${month}-${uniqueIdPortion}`;

      // C. Insert Sales Order Record (CRITICAL: Commits SO first, Job link is missing/null)
      const { data: soData, error: soError } = await supabase
        .from("sales_orders")
        .insert({
          sales_order_number: salesOrderNum,
          client_id: client_id,
          cabinet_id: cabinetId,
          stage: stage,
          total: total,
          deposit: deposit,
          invoice_balance: (total || 0) - (deposit || 0),
          designer: user?.username || "Staff",
          comments: comments,
          install: install,
          order_type: order_type,
          delivery_type: delivery_type,
          ...shipping,
          ...checklist,
        })
        .select("id")
        .single();

      if (soError) throw new Error(`Sales Order Error: ${soError.message}`);
      const salesOrderId = soData.id; // Capture the committed SO ID

      // --- 4. JOB CREATION & BACKWARD LINKING (Only if SOLD) ---
      let jobDataForReturn: JobResult | null = null;
      let finalJobNumber: string | null = null;

      if (stage === "SOLD") {
        // 1. Determine base number to reuse from local state
        let baseNumberToReuse: number | null = null;
        if (parentBaseSelection) {
          const base = Number(parentBaseSelection);
          if (!isNaN(base) && base > 0) {
            baseNumberToReuse = base;
          } else {
            throw new Error("Invalid job base number selected.");
          }
        }

        // 2. Call RPC to create job record and link back to the SO
        const { data: jobResult, error: rpcError } = await supabase.rpc(
          "create_job_and_link_so", // Renamed RPC
          {
            p_sales_order_id: salesOrderId,
            p_existing_base_number: baseNumberToReuse,
          }
        );

        if (rpcError)
          throw new Error(`Job Creation Failed: ${rpcError.message}`);
        if (!jobResult || jobResult.length === 0)
          throw new Error("No job data returned from RPC.");

        jobDataForReturn = jobResult[0] as JobResult;
        finalJobNumber = jobDataForReturn.out_job_number;
      }

      // Return confirmation payload for onSuccess handler
      return {
        success: true,
        salesOrderNum: salesOrderNum,
        finalJobNum: finalJobNumber, // Return the final formatted job number
      };
    },

    // --- ON SUCCESS HANDLER ---
    onSuccess: (data) => {
      notifications.show({
        title: "Order Processed",
        message: `Order ${data.salesOrderNum} saved successfully.`,
        color: "green",
      });

      if (data.finalJobNum) {
        // Set state to trigger the auto-dismissing success banner
        setSuccessBannerData({
          jobNum: data.finalJobNum || "N/A",
        });
        // Cleanup/redirect is handled by the setTimeout watching successBannerData
        const timer = setTimeout(() => {
          form.reset();
          setSelectedClientData(null);
          queryClient.invalidateQueries({ queryKey: ["sales_orders"] });
          router.push("/dashboard/sales");
        }, 5000);
      } else {
        form.reset();
        setSelectedClientData(null);
        queryClient.invalidateQueries({ queryKey: ["sales_orders"] });
        router.push("/dashboard/sales");
      }
      // Handle QUOTE completion (no job created, redirect immediately)
    },

    // --- ON ERROR HANDLER ---
    onError: (err) => {
      notifications.show({
        title: "Error",
        message: err.message,
        color: "red",
      });
    },
  });

  const copyClientToShipping = () => {
    if (!selectedClientData) {
      notifications.show({
        message: "Please select a client first",
        color: "orange",
      });
      return;
    }

    form.setFieldValue(`shipping`, {
      shipping_client_name: `${selectedClientData.firstName ?? ""} ${
        selectedClientData.lastName
      }`,
      shipping_street: selectedClientData.street,
      shipping_city: selectedClientData.city,
      shipping_province: selectedClientData.province,
      shipping_zip: selectedClientData.zip,
      shipping_phone_1: selectedClientData.phone1,
      shipping_phone_2: selectedClientData.phone2,
      shipping_email_1: selectedClientData.email1,
      shipping_email_2: selectedClientData.email2,
    });
  };

  if (!isAuthenticated || clientsLoading) {
    return (
      <Center style={{ height: "100vh", width: "100%" }}>
        <Loader />
        <Text ml="md">Loading...</Text>
      </Center>
    );
  }

  if (isError) {
    return (
      <Center style={{ height: "100vh", width: "100%" }}>
        <Text c="red">Error loading clients: {error?.message}</Text>
      </Center>
    );
  }
  const handleSubmit = (values: MasterOrderInput) => {
    if (Object.keys(form.errors).length > 0) {
      console.error("Zod Validation Blocked Submission:", form.errors);

      notifications.show({
        title: "Validation Failed",
        message: "Please correct the highlighted fields before submitting.",
        color: "red",
      });
      return;
    }

    submitMutation.mutate(values);
  };
  return (
    <Container size="100%" p="md" bg={"gray.3"}>
      {/* ... Render structure ... */}

      <form
        noValidate
        onSubmit={form.onSubmit(handleSubmit)}
        id="single-order-form"
      >
        <Stack>
          {/* 1. MASTER DETAILS (Client & Stage) */}

          <Paper withBorder p="md" radius="md" shadow="xl">
            <Group align="end" mt="md" style={{ width: "100%" }}>
              <Paper p="xs" px="md" shadow="false">
                <Switch
                  offLabel="Quote"
                  onLabel="Sold"
                  size="xl"
                  color="green"
                  checked={form.values.stage === "SOLD"}
                  onChange={(e) =>
                    form.setFieldValue(
                      "stage",
                      e.currentTarget.checked ? "SOLD" : "QUOTE"
                    )
                  }
                />
              </Paper>

              <Select
                label="Link to Existing Job"
                placeholder="Search existing jobs..."
                data={jobBaseOptions || []}
                searchable
                clearable
                disabled={jobsLoading || form.values.stage != "SOLD"}
                style={{ flex: 1 }}
                styles={{
                  dropdown: {
                    boxShadow: "var(--mantine-shadow-xl)",
                    borderColor: "var(--mantine-color-gray-4)",
                    borderWidth: "1px",
                    borderStyle: "solid",
                    backgroundColor: "var(--mantine-color-gray-2)",
                  },
                  root: { maxWidth: "200px" },
                }}
                comboboxProps={{
                  position: "bottom",
                  middlewares: { flip: false, shift: false },
                  offset: 0,
                }}
                value={parentBaseSelection}
                onChange={(val) => {
                  setParentBaseSelection(val);
                }}
              />
              <Select
                label="Client"
                placeholder="Search clients..."
                clearable
                comboboxProps={{
                  position: "bottom",
                  middlewares: { flip: false, shift: false },
                  offset: 0,
                }}
                data={clientSelectOptions}
                searchable
                nothingFoundMessage={
                  <Stack align="center" p="xs" gap="xs">
                    <Text size="sm" c="dimmed">
                      No matching clients found.
                    </Text>
                    <Button
                      variant="filled"
                      size="xs"
                      onClick={() => setIsAddClientModalOpen(true)}
                      leftSection={<FaPlus size={12} />}
                    >
                      Add New Client
                    </Button>
                  </Stack>
                }
                disabled={clientsLoading || clientSelectOptions.length === 0}
                style={{
                  flex: 1,
                }}
                styles={{
                  dropdown: {
                    boxShadow: "var(--mantine-shadow-xl)",
                    borderColor: "var(--mantine-color-gray-4)",
                    borderWidth: "1px",
                    borderStyle: "solid",
                    backgroundColor: "var(--mantine-color-gray-2)",
                  },
                  root: { maxWidth: "40%" },
                }}
                {...form.getInputProps("client_id")}
                renderOption={({ option }) => {
                  const clientOption = option as ClientSelectOption;
                  const clientData: ClientType = clientOption.original;
                  return (
                    <Group
                      justify="space-between"
                      wrap="nowrap"
                      gap="md"
                      style={{ width: "100%" }}
                    >
                      <Stack gap={0} style={{ flexGrow: 1 }}>
                        <Text fw={700} size="sm">
                          {clientData.lastName}{" "}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {clientData.street || "—"}, {clientData.city || "—"}
                        </Text>
                      </Stack>
                      <Badge variant="light" color="blue" size="sm" radius="sm">
                        {clientData.phone1 || "—"}
                      </Badge>
                    </Group>
                  );
                }}
                value={String(form.values.client_id)}
                onChange={(val) => {
                  form.setFieldValue("client_id", Number(val));
                  const fullObj = clientSelectOptions.find(
                    (c) => c.value === val
                  )?.original;
                  setSelectedClientData(fullObj as ClientType);
                  form.setFieldValue(`shipping`, {
                    shipping_client_name: "",
                    shipping_street: "",
                    shipping_city: "",
                    shipping_province: "",
                    shipping_zip: "",
                    shipping_phone_1: "",
                    shipping_phone_2: "",
                    shipping_email_1: "",
                    shipping_email_2: "",
                  });
                }}
              />
            </Group>
          </Paper>
          {/* --- CONDITIONAL BILLING INFO SECTION --- */}

          {selectedClientData ? (
            <SimpleGrid
              cols={{ base: 1, lg: 2 }}
              spacing="md"
              bg={"white"}
              p="10px"
            >
              {/* LEFT COLUMN: Read-Only Client Billing Details */}

              <Fieldset legend="Billing Details" variant="filled" bg={"gray.2"}>
                <Stack gap="sm">
                  {" "}
                  {/* Increased gap for better vertical separation */}
                  {/* 1. Client Name */}
                  <Stack gap={0}>
                    <Text size="xs" c="dimmed">
                      Client Name
                    </Text>
                    <Text fw={600} size="sm">
                      {selectedClientData.lastName}
                    </Text>
                  </Stack>
                  {/* 2. Primary Contact Details (Phone 1 and Email 1) */}
                  <SimpleGrid cols={2} spacing="md">
                    <Stack gap={0}>
                      <Text size="xs" c="dimmed">
                        Phone 1
                      </Text>
                      <Text fw={500} size="sm">
                        {selectedClientData.phone1 || "N/A"}
                      </Text>
                    </Stack>
                    <Stack gap={0}>
                      <Text size="xs" c="dimmed">
                        Email 1
                      </Text>
                      <Text fw={500} size="sm">
                        {selectedClientData.email1 || "N/A"}
                      </Text>
                    </Stack>
                  </SimpleGrid>
                  {/* 3. Secondary Contact Details (Phone 2 and Email 2) */}
                  <SimpleGrid cols={2} spacing="md">
                    <Stack gap={0}>
                      <Text size="xs" c="dimmed">
                        Phone 2
                      </Text>
                      <Text fw={500} size="sm">
                        {selectedClientData.phone2 || "—"}
                      </Text>
                    </Stack>
                    <Stack gap={0}>
                      <Text size="xs" c="dimmed">
                        Email 2
                      </Text>
                      <Text fw={500} size="sm">
                        {selectedClientData.email2 || "—"}
                      </Text>
                    </Stack>
                  </SimpleGrid>
                  <Divider my={2} />
                  {/* 4. Address Details (Fully Stacked) */}
                  <Stack gap="xs">
                    {/* Stack for the entire address block */}

                    {/* 1. Address Label (Single instance) */}
                    <Text size="xs" c="dimmed">
                      Billing Address
                    </Text>

                    {/* 2. Full Address Value (Single line) */}
                    <Text fw={500} size="sm" mt={-5}>
                      {`${selectedClientData.street || "—"}, ${
                        selectedClientData.city || "—"
                      }, ${selectedClientData.province || "—"} ${
                        selectedClientData.zip || "—"
                      }`}
                    </Text>
                  </Stack>
                </Stack>
              </Fieldset>
              <Fieldset
                legend="Shipping Details"
                variant="filled"
                bg={"gray.2"}
              >
                {/* Reduced outer gap from 'md' to 'sm' */}
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<FaCopy />}
                      onClick={() => copyClientToShipping()}
                      disabled={!selectedClientData}
                    >
                      Copy from Billing
                    </Button>
                  </Group>

                  {/* 1. Recipient Name & Street Address (Consolidated to one row) */}
                  {/* Uses SimpleGrid to place inputs side-by-side where possible */}
                  <SimpleGrid cols={2} spacing="sm">
                    <TextInput
                      label="Client Name"
                      placeholder="Name of recipient"
                      {...form.getInputProps(`shipping.shipping_client_name`)}
                    />
                    <TextInput
                      label="Street Address"
                      placeholder="123 Main St"
                      {...form.getInputProps(`shipping.shipping_street`)}
                    />
                  </SimpleGrid>

                  {/* 2. City, State, Zip (Remains 3 columns, but compact) */}
                  <SimpleGrid cols={3} spacing="sm">
                    <TextInput
                      label="City"
                      {...form.getInputProps(`shipping.shipping_city`)}
                    />
                    <TextInput
                      label="Province"
                      {...form.getInputProps(`shipping.shipping_province`)}
                    />
                    <TextInput
                      label="Zip"
                      {...form.getInputProps(`shipping.shipping_zip`)}
                    />
                  </SimpleGrid>

                  {/* 3. Phone 1 & 2 (Consolidated) */}
                  <SimpleGrid cols={2} spacing="sm">
                    <TextInput
                      label="Phone 1"
                      {...form.getInputProps(`shipping.shipping_phone_1`)}
                    />
                    <TextInput
                      label="Phone 2"
                      {...form.getInputProps(`shipping.shipping_phone_2`)}
                    />
                  </SimpleGrid>

                  {/* 4. Email 1 & 2 (Consolidated) */}
                  <SimpleGrid cols={2} spacing="sm">
                    <TextInput
                      label="Email 1"
                      {...form.getInputProps(`shipping.shipping_email_1`)}
                    />
                    <TextInput
                      label="Email 2"
                      {...form.getInputProps(`shipping.shipping_email_2`)}
                    />
                  </SimpleGrid>
                </Stack>
              </Fieldset>
            </SimpleGrid>
          ) : (
            <Center style={{ height: "100px" }} bg={"white"}>
              <Text c="dimmed" size="sm">
                Please select a Client to view billing details.
              </Text>
            </Center>
          )}

          <Paper withBorder p="md" radius="md" shadow="xl">
            <SimpleGrid cols={{ base: 1, xl: 2 }} spacing={30}>
              {/* LEFT COLUMN: Cabinet & Financials */}
              <Stack>
                <Fieldset
                  legend="Cabinet Specifications"
                  variant="filled"
                  bg={"gray.2"}
                >
                  {/* Row 1: Core Aesthetics */}
                  <SimpleGrid cols={3}>
                    <TextInput
                      label="Species"
                      {...form.getInputProps(`cabinet.species`)}
                    />
                    <TextInput
                      label="Color"
                      {...form.getInputProps(`cabinet.color`)}
                    />
                    <TextInput
                      label="Door Style"
                      {...form.getInputProps(`cabinet.door_style`)}
                    />
                    <TextInput
                      label="Finish"
                      {...form.getInputProps(`cabinet.finish`)}
                    />
                    <TextInput
                      label="Glaze"
                      {...form.getInputProps(`cabinet.glaze`)}
                    />
                    <TextInput
                      label="Top Drawer Front"
                      {...form.getInputProps(`cabinet.top_drawer_front`)}
                    />
                  </SimpleGrid>

                  {/* Row 2: Box, Drawers, and Interior Details */}
                  <SimpleGrid cols={4} mt="md">
                    <TextInput
                      label="Box Type"
                      {...form.getInputProps(`cabinet.box`)}
                    />
                    <TextInput
                      label="Interior Material"
                      {...form.getInputProps(`cabinet.interior`)}
                    />
                    <TextInput
                      label="Drawer Box"
                      {...form.getInputProps(`cabinet.drawer_box`)}
                    />
                    <TextInput
                      label="Drawer Hardware"
                      {...form.getInputProps(`cabinet.drawer_hardware`)}
                    />
                  </SimpleGrid>

                  <Divider mt="md" />

                  {/* Row 3: CONDITIONAL GROUPS (Glass & Parts Count) */}
                  <SimpleGrid cols={2} mt="md">
                    {/* COLUMN 1: GLASS SPECIFICATIONS */}
                    <Stack gap={5}>
                      <Switch
                        label="Glass Doors Required"
                        color="green"
                        {...form.getInputProps(`cabinet.glass`)}
                      />
                      <TextInput
                        label="Glass Type"
                        placeholder="e.g., Frosted, Clear"
                        disabled={!form.values.cabinet.glass}
                        {...form.getInputProps(`cabinet.glass_type`)}
                      />
                    </Stack>

                    {/* COLUMN 2: PIECE COUNT SPECIFICATIONS */}
                    <Stack gap={5}>
                      <Switch
                        label="Doors/Parts Only Order"
                        color="green"
                        {...form.getInputProps(`cabinet.doors_parts_only`)}
                      />
                      <TextInput
                        label="Total Piece Count"
                        placeholder="e.g., 42"
                        disabled={!form.values.cabinet.doors_parts_only}
                        {...form.getInputProps(`cabinet.piece_count`)}
                      />
                    </Stack>
                  </SimpleGrid>

                  <Divider mt="md" />

                  {/* Row 4: Hardware & General */}
                  <SimpleGrid cols={2} mt="md">
                    <Group>
                      <Switch
                        label="Soft Close Hinges"
                        size="md"
                        color="green"
                        {...form.getInputProps(`cabinet.hinge_soft_close`)}
                      />
                      <Switch
                        label="Handles Supplied"
                        size="md"
                        color="green"
                        {...form.getInputProps(`cabinet.handles_supplied`)}
                      />
                      <Switch
                        label="Handles Selected"
                        size="md"
                        color="green"
                        {...form.getInputProps(`cabinet.handles_selected`)}
                      />
                    </Group>
                  </SimpleGrid>
                </Fieldset>

                <Fieldset legend="Financials" variant="filled" bg={"gray.2"}>
                  <SimpleGrid cols={3}>
                    <NumberInput
                      label="Total Amount"
                      prefix="$"
                      min={0}
                      {...form.getInputProps(`total`)}
                    />
                    <NumberInput
                      label="Deposit"
                      prefix="$"
                      min={0}
                      {...form.getInputProps(`deposit`)}
                    />
                    <TextInput
                      label="Balance"
                      readOnly
                      value={`$${
                        (form.values.total || 0) - (form.values.deposit || 0)
                      }`}
                      variant="filled"
                    />
                  </SimpleGrid>
                </Fieldset>
              </Stack>

              {/* RIGHT COLUMN: Production Checklist & Details */}
              <Stack>
                <Fieldset
                  legend="Production Checklist (Dates)"
                  variant="filled"
                  bg={"gray.2"}
                >
                  <SimpleGrid cols={3}>
                    <Box w="100%">
                      <DateInput
                        label="Layout"
                        clearable
                        {...form.getInputProps(`checklist.layout_date`)}
                      />
                    </Box>

                    <DateInput
                      label="Client Meeting"
                      clearable
                      {...form.getInputProps(`checklist.client_meeting_date`)}
                    />
                    <DateInput
                      label="Follow Up"
                      clearable
                      {...form.getInputProps(`checklist.follow_up_date`)}
                    />
                  </SimpleGrid>
                  <SimpleGrid cols={3} mt="sm">
                    <DateInput
                      label="Appliance Specs"
                      clearable
                      {...form.getInputProps(`checklist.appliance_specs_date`)}
                    />
                    <DateInput
                      label="Selections"
                      clearable
                      {...form.getInputProps(`checklist.selections_date`)}
                    />
                    <DateInput
                      label="Measure (Markout)"
                      clearable
                      {...form.getInputProps(`checklist.markout_date`)}
                    />
                  </SimpleGrid>
                  <SimpleGrid cols={3} mt="sm">
                    <DateInput
                      label="Review"
                      clearable
                      {...form.getInputProps(`checklist.review_date`)}
                    />
                    <DateInput
                      label="Second Markout"
                      clearable
                      {...form.getInputProps(`checklist.second_markout_date`)}
                    />
                    <div></div> {/* Placeholder */}
                  </SimpleGrid>
                </Fieldset>

                <Fieldset legend="Details" variant="filled" bg={"gray.2"}>
                  <TextInput
                    label="Comments"
                    {...form.getInputProps(`comments`)}
                  />
                  <SimpleGrid cols={2} mt="sm">
                    <TextInput
                      label="Order Type"
                      placeholder="Kitchen, Vanity..."
                      {...form.getInputProps(`order_type`)}
                    />
                    <TextInput
                      label="Delivery Type"
                      placeholder="Pickup, Delivery..."
                      {...form.getInputProps(`delivery_type`)}
                    />
                  </SimpleGrid>
                  <SimpleGrid cols={2} mt="sm">
                    <TextInput
                      label="Flooring Type"
                      placeholder="Hardwood, Tile, etc."
                      {...form.getInputProps(`checklist.flooring_type`)}
                    />
                    <TextInput
                      label="Flooring Clearance"
                      placeholder="e.g., Yes, 1/2 inch gap"
                      {...form.getInputProps(`checklist.flooring_clearance`)}
                    />
                  </SimpleGrid>
                  <Switch
                    color="green"
                    mt="md"
                    label="Installation Required"
                    {...form.getInputProps(`install`)}
                  />
                </Fieldset>
              </Stack>
            </SimpleGrid>
          </Paper>

          {/* SUBMIT BAR */}
          <Paper
            withBorder
            p="md"
            radius="md"
            pos="sticky"
            bottom={0}
            style={{ zIndex: 10 }}
          >
            <Group justify="flex-end">
              <Button
                color="red"
                size="md"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="md"
                loading={submitMutation.isPending}
                color={form.values.stage === "SOLD" ? "green" : "blue"}
                form="single-order-form"
              >
                {form.values.stage === "SOLD" ? "Process Sale" : "Save Quote"}
              </Button>
            </Group>
          </Paper>
        </Stack>
      </form>
      <AddClient
        opened={isAddClientModalOpen}
        onClose={() => {
          setIsAddClientModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ["clients-list"] });
        }}
      />
      {successBannerData && (
        <Center
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,

            backgroundColor: "rgba(238, 240, 243, 0.98)",
            zIndex: 1000,
          }}
        >
          <Paper
            shadow="xl"
            radius="lg"
            p={40}
            withBorder
            style={{
              minWidth: "350px",
              maxWidth: "450px",
              borderColor: "var(--mantine-color-green-5)",
              borderWidth: "3px",
              textAlign: "center",
            }}
          >
            <Stack align="center" gap="md">
              {/* Visual Checkmark Icon */}
              <FaCheckCircle size={56} color="var(--mantine-color-green-6)" />

              {/* Main Title */}
              <Title
                order={3}
                c="dark"
                mt="sm"
                style={{ textTransform: "uppercase", letterSpacing: "1px" }}
              >
                New Job Created!
              </Title>
              <Badge
                color="green"
                size="xl"
                variant="filled"
                radius="md"
                p="md"
              >
                <Text component="span" fw={900} size="xl">
                  {successBannerData.jobNum}
                </Text>
              </Badge>

              {/* Auto-Dismiss Message */}
              <Text size="sm" c="dimmed" mt="lg">
                Redirecting to dashboard...
              </Text>
            </Stack>
          </Paper>
        </Center>
      )}
    </Container>
  );
}
