"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@mantine/form";
import { zodResolver } from "@/utils/zodResolver/zodResolver";
import { useSupabase } from "@/hooks/useSupabase";
import {
  Container,
  Paper,
  Stack,
  Group,
  Text,
  Switch,
  Button,
  SimpleGrid,
  Loader,
  Center,
  Divider,
  Select,
  Box,
  Timeline,
  TimelineItem,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import dayjs from "dayjs";
import { notifications } from "@mantine/notifications";
import {
  FaCheckCircle,
  FaCogs,
  FaCut,
  FaDoorOpen,
  FaFire,
  FaIndustry,
  FaPaintBrush,
  FaShippingFast,
} from "react-icons/fa";
import { schedulingSchema } from "@/zod/prod.schema";

// ---------- Types ----------
type CabinetType = {
  id: number;
  species: string;
  color: string;
  finish: string;
  glaze: string;
  door_style: string;
  top_drawer_front: string;
  interior: string;
  drawer_box: string | null;
  drawer_hardware: string;
  box: string;
  hinge_soft_close: boolean;
  doors_parts_only: boolean;
  hardware_only?: boolean;
  handles_selected?: boolean;
  handles_supplied?: boolean;
  glass: boolean;
  piece_count: string;
  hardware_quantity?: string | null;
  glass_type: string;
  created_at: string;
  updated_at: string;
};

type ClientType = {
  id: number;
  firstName?: string;
  lastName: string;
  street?: string;
  city?: string;
  province?: string;
  zip?: string;
  phone1?: string;
  phone2?: string;
  email1?: string;
  email2?: string;
};

type SalesOrderType = {
  id: number;
  client: ClientType;
  cabinet: CabinetType;
};

type SchedulingFormValues = {
  rush: boolean;
  placement_date: string | null;
  doors_in_schedule: string | null;
  doors_out_schedule: string | null;
  cut_finish_schedule: string | null;
  cut_melamine_schedule: string | null;
  paint_in_schedule: string | null;
  paint_out_schedule: string | null;
  assembly_schedule: string | null;
  ship_schedule: string | null;
  in_plant_actual: string | null;
  ship_status: "unprocessed" | "tentative" | "confirmed";
};

type JobType = {
  id: number;
  job_number: string;
  job_base_number: number;
  job_suffix?: string;
  sales_orders: SalesOrderType;
  production_schedule: SchedulingFormValues;
};

// ---------- Component ----------
export default function EditProductionSchedulePage({
  jobId,
}: {
  jobId: number;
}) {
  const router = useRouter();
  const { supabase, isAuthenticated } = useSupabase();
  const { user } = useUser();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["production-schedule", jobId],
    queryFn: async (): Promise<JobType> => {
      const { data, error } = await supabase
        .from("jobs")
        .select(
          `
          *,
          production_schedule:production_schedule (*),
          sales_orders:sales_orders (
            id,
            client:client (*),
            cabinet:cabinets (*)
          )
        `
        )
        .eq("id", jobId)
        .single();

      if (error) throw error;
      return data as JobType;
    },
    enabled: isAuthenticated && !!jobId,
  });

  const form = useForm<SchedulingFormValues>({
    initialValues: {
      rush: false,
      placement_date: null,
      doors_in_schedule: null,
      doors_out_schedule: null,
      cut_finish_schedule: null,
      cut_melamine_schedule: null,
      paint_in_schedule: null,
      paint_out_schedule: null,
      assembly_schedule: null,
      ship_schedule: null,
      in_plant_actual: null,
      ship_status: "unprocessed",
    },
    validate: zodResolver(schedulingSchema),
  });

  useEffect(() => {
    if (data?.production_schedule) {
      form.setValues(data.production_schedule);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async (values: SchedulingFormValues) => {
      if (!user) throw new Error("User not authenticated");
      const prodId = (data?.production_schedule as any)?.prod_id;
      const { error } = await supabase
        .from("production_schedule")
        .update(values)
        .eq("prod_id", prodId);

      if (error) throw error;
    },
    onSuccess: () => {
      notifications.show({
        title: "Success",
        message: "Production schedule updated successfully",
        color: "green",
      });
      queryClient.invalidateQueries({
        queryKey: ["production-schedule", jobId],
      });
      queryClient.invalidateQueries({
        queryKey: ["production_schedule_list"],
      });
      router.push("/dashboard/production");
    },
    onError: (err: any) => {
      notifications.show({
        title: "Error",
        message: err.message,
        color: "red",
      });
    },
  });

  if (isLoading || !data) {
    return (
      <Center h="100vh">
        <Loader />
        <Text ml="md">Loading...</Text>
      </Center>
    );
  }

  const handleSubmit = (values: SchedulingFormValues) => {
    updateMutation.mutate(values);
  };

  const client = data.sales_orders?.client;
  const cabinet = data.sales_orders?.cabinet;

  return (
    <Container
      size="100%"
      pl={10}
      w="100%"
      style={{
        paddingRight: 0,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <form
        onSubmit={form.onSubmit(handleSubmit)}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        <Stack>
          {/* HEADER */}
          <Paper
            p="md"
            radius="md"
            shadow="sm"
            style={{ background: "#e3e3e3" }}
          >
            <Group align="center">
              <Text
                fw={600}
                size="lg"
                style={{ display: "flex", alignItems: "center" }}
              >
                Job #{data.job_number}{" "}
                <FaFire size={16} color="red" style={{ marginLeft: 4 }} />
              </Text>
            </Group>

            <Divider my="sm" color="purple" />

            <SimpleGrid cols={2}>
              {/* CLIENT INFO */}
              {client && (
                <Paper
                  p="md"
                  radius="md"
                  shadow="sm"
                  mb="md"
                  style={{ background: "#f5f5f5" }}
                >
                  <Text fw={600} mb="sm">
                    Client Details
                  </Text>
                  <SimpleGrid cols={3} spacing="sm">
                    <Text size="sm">
                      <strong>Client Name:</strong> {client.lastName || "—"}
                    </Text>
                    <Text size="sm">
                      <strong>Street:</strong> {client.street || "—"}
                    </Text>
                    <Text size="sm">
                      <strong>City:</strong> {client.city || "—"}
                    </Text>
                    <Text size="sm">
                      <strong>Province:</strong> {client.province || "—"}
                    </Text>
                    <Text size="sm">
                      <strong>ZIP:</strong> {client.zip || "—"}
                    </Text>
                    <Text size="sm">
                      <strong>Phone 1:</strong> {client.phone1 || "—"}
                    </Text>
                    <Text size="sm">
                      <strong>Phone 2:</strong> {client.phone2 || "—"}
                    </Text>
                    <Text size="sm">
                      <strong>Email 1:</strong> {client.email1 || "—"}
                    </Text>
                    <Text size="sm">
                      <strong>Email 2:</strong> {client.email2 || "—"}
                    </Text>
                  </SimpleGrid>
                </Paper>
              )}

              {/* CABINET INFO */}
              {cabinet && (
                <Paper
                  p="md"
                  radius="md"
                  shadow="sm"
                  mb="md"
                  style={{ background: "#f5f5f5" }}
                >
                  <Text fw={600} mb="sm">
                    Cabinet Details
                  </Text>
                  <SimpleGrid cols={3} spacing="sm">
                    <Text size="sm">
                      <strong>Box:</strong> {cabinet.box || "—"}
                    </Text>
                    <Text size="sm">
                      <strong>Species:</strong> {cabinet.species || "—"}
                    </Text>
                    <Text size="sm">
                      <strong>Color:</strong> {cabinet.color || "—"}
                    </Text>
                    <Text size="sm">
                      <strong>Finish:</strong> {cabinet.finish || "—"}
                    </Text>
                    <Text size="sm">
                      <strong>Glaze:</strong> {cabinet.glaze || "—"}
                    </Text>
                    <Text size="sm">
                      <strong>Door Style:</strong> {cabinet.door_style || "—"}
                    </Text>
                    <Text size="sm">
                      <strong>Top Drawer Front:</strong>{" "}
                      {cabinet.top_drawer_front || "—"}
                    </Text>
                    <Text size="sm">
                      <strong>Interior:</strong> {cabinet.interior || "—"}
                    </Text>
                    <Text size="sm">
                      <strong>Drawer Box:</strong> {cabinet.drawer_box || "—"}
                    </Text>
                    <Text size="sm">
                      <strong>Drawer Hardware:</strong>{" "}
                      {cabinet.drawer_hardware || "—"}
                    </Text>
                    <Text size="sm">
                      <strong>Glass:</strong> {cabinet.glass ? "Yes" : "No"}
                    </Text>
                    <Text size="sm">
                      <strong>Glass Type:</strong> {cabinet.glass_type || "—"}
                    </Text>
                    <Text size="sm">
                      <strong>Piece Count:</strong> {cabinet.piece_count || "—"}
                    </Text>
                    <Text size="sm">
                      <strong>Hardware Only:</strong>{" "}
                      {cabinet.hardware_only ? "Yes" : "No"}
                    </Text>
                    <Text size="sm">
                      <strong>Doors Parts Only:</strong>{" "}
                      {cabinet.doors_parts_only ? "Yes" : "No"}
                    </Text>
                    <Text size="sm">
                      <strong>Handles Selected:</strong>{" "}
                      {cabinet.handles_selected ? "Yes" : "No"}
                    </Text>
                    <Text size="sm">
                      <strong>Handles Supplied:</strong>{" "}
                      {cabinet.handles_supplied ? "Yes" : "No"}
                    </Text>
                    <Text size="sm">
                      <strong>Hinge Soft Close:</strong>{" "}
                      {cabinet.hinge_soft_close ? "Yes" : "No"}
                    </Text>
                  </SimpleGrid>
                </Paper>
              )}
            </SimpleGrid>
          </Paper>

          {/* FORM */}

          <Paper p="md" radius="md" shadow="xl" pb={"30px"}>
            <Stack>
              {/* --- GROUP 1: Placement + Shipping --- */}
              <Switch
                size="xl"
                offLabel="Normal"
                onLabel="Rush"
                thumbIcon={<FaFire />}
                {...form.getInputProps("rush", { type: "checkbox" })}
                checked={form.values.rush}
                onChange={(e) =>
                  form.setFieldValue("rush", e.currentTarget.checked)
                }
                styles={{
                  track: {
                    padding: "5px",
                    cursor: "pointer",
                    background: form.values.rush
                      ? "linear-gradient(135deg, #ff4d4d 0%, #c80000 100%)"
                      : "linear-gradient(135deg, #555555 0%, #e3e3e3 100%)",
                    border: "none",
                    color: form.values.rush ? "white" : "black",
                    transition: "background 200ms ease",
                  },
                  thumb: {
                    background: form.values.rush ? "#ff6b6b" : "#fff",
                  },
                  label: {
                    fontWeight: 600,
                    display: "inline-block",
                  },
                }}
              />

              <Box>
                <Group mb={8}>
                  <FaShippingFast size={18} />
                  <Text fw={600}>Placement & Shipping</Text>
                </Group>

                <SimpleGrid cols={4} spacing="sm">
                  {/* Placement Date */}

                  <DateInput
                    label="Placement Date"
                    {...form.getInputProps("placement_date")}
                  />
                  {/* Ship Date */}
                  <DateInput
                    label="Ship Date"
                    {...form.getInputProps("ship_schedule")}
                  />
                  <Group align="flex-end">
                    {/* Ship Status */}
                    <Select
                      w={"150px"}
                      label="Ship Status"
                      data={[
                        { value: "unprocessed", label: "Unprocessed" },
                        { value: "tentative", label: "Tentative" },
                        { value: "confirmed", label: "Confirmed" },
                      ]}
                      {...form.getInputProps("ship_status")}
                      styles={() => {
                        const v = form.values.ship_status;

                        let gradient =
                          "linear-gradient(135deg, #B0BEC5, #78909C)";

                        if (v === "confirmed") {
                          gradient =
                            "linear-gradient(135deg, #4A00E0, #8E2DE2)";
                        } else if (v === "tentative") {
                          gradient =
                            "linear-gradient(135deg, #FF6A00, #FFB347)";
                        }

                        return {
                          input: {
                            background: gradient,
                            color: "white",
                            fontWeight: 600,
                            border: "none",
                            transition: "background 200ms ease",
                          },
                          dropdown: {
                            borderRadius: 8,
                          },
                          item: {
                            "&[data-selected]": {
                              background: gradient,
                              color: "white",
                            },
                          },
                        };
                      }}
                    />
                    <Box
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        paddingBottom: 2,
                      }}
                    >
                      <Switch
                        size="lg"
                        offLabel="Not In Plant"
                        onLabel="In Plant"
                        thumbIcon={<FaIndustry />}
                        checked={!!form.values.in_plant_actual}
                        onChange={(e) => {
                          if (e.currentTarget.checked) {
                            form.setFieldValue(
                              "in_plant_actual",
                              new Date().toISOString()
                            );
                          } else {
                            form.setFieldValue("in_plant_actual", null);
                          }
                        }}
                        styles={{
                          track: {
                            padding: "4px",
                            cursor: "pointer",
                            background: form.values.in_plant_actual
                              ? "linear-gradient(135deg, #28a745 0%, #218838 100%)" // green
                              : "linear-gradient(135deg, #ff9a9a 0%, #ff6b6b 100%)",
                            border: "none",
                            color: form.values.in_plant_actual
                              ? "white"
                              : "black",
                            transition: "background 200ms ease",
                          },
                          thumb: {
                            background: form.values.in_plant_actual
                              ? "#218838"
                              : "#fff",
                          },
                          label: {
                            fontWeight: 600,
                            display: "inline-block",
                          },
                        }}
                      />
                    </Box>
                  </Group>

                  {/* Switch — aligned perfectly at bottom */}
                </SimpleGrid>
              </Box>
              <SimpleGrid cols={2} spacing="sm">
                {/* --- GROUP 2: Doors In/Out --- */}
                <Box>
                  <Group mb={8}>
                    <FaDoorOpen size={18} />
                    <Text fw={600}>Doors Schedule</Text>
                  </Group>

                  <SimpleGrid cols={2} spacing="sm">
                    <DateInput
                      label="Doors In Schedule"
                      placeholder="Select date"
                      clearable
                      {...form.getInputProps("doors_in_schedule")}
                    />

                    <DateInput
                      label="Doors Out Schedule"
                      {...form.getInputProps("doors_out_schedule")}
                    />
                  </SimpleGrid>
                </Box>

                {/* --- GROUP 3: Cut Finish & Cut Melamine --- */}
                <Box>
                  <Group mb={8}>
                    <FaCut size={18} />
                    <Text fw={600}>Cutting Schedule</Text>
                  </Group>

                  <SimpleGrid cols={2} spacing="sm">
                    <DateInput
                      label="Cut Finish Schedule"
                      {...form.getInputProps("cut_finish_schedule")}
                    />
                    <DateInput
                      label="Cut Melamine Schedule"
                      {...form.getInputProps("cut_melamine_schedule")}
                    />
                  </SimpleGrid>
                </Box>

                {/* --- GROUP 4: Paint In/Out --- */}
                <Box>
                  <Group mb={8}>
                    <FaPaintBrush size={18} />
                    <Text fw={600}>Paint Schedule</Text>
                  </Group>

                  <SimpleGrid cols={2} spacing="sm">
                    <DateInput
                      label="Paint In Schedule"
                      {...form.getInputProps("paint_in_schedule")}
                    />
                    <DateInput
                      label="Paint Out Schedule"
                      {...form.getInputProps("paint_out_schedule")}
                    />
                  </SimpleGrid>
                </Box>

                {/* --- GROUP 5: Assembly --- */}
                <Box>
                  <Group mb={8}>
                    <FaCogs size={18} />
                    <Text fw={600}>Assembly</Text>
                  </Group>

                  <SimpleGrid cols={1} spacing="sm">
                    <DateInput
                      label="Assembly Schedule"
                      {...form.getInputProps("assembly_schedule")}
                    />
                  </SimpleGrid>
                </Box>
              </SimpleGrid>
            </Stack>
          </Paper>
        </Stack>
      </form>

      <Paper
        p="md"
        style={{
          position: "sticky",
          bottom: 0,
          zIndex: 10,
          background: "linear-gradient(135deg, #DDE6F5 0%, #E7D9F0 100%)",
        }}
      >
        <Group justify="flex-end">
          <Button
            variant="outline"
            style={{
              background: "linear-gradient(135deg, #FF6B6B 0%, #FF3B3B 100%)",
              color: "white",
              border: "none",
            }}
            size="md"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="md"
            color="blue"
            style={{
              background: "linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)",
              color: "white",
              border: "none",
            }}
            onClick={() =>
              form.onSubmit((values) => {
                handleSubmit(values);
              })()
            }
          >
            Update Schedule
          </Button>
        </Group>
      </Paper>
    </Container>
  );
}
