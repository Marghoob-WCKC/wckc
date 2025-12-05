"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Drawer,
  Loader,
  Center,
  Text,
  Stack,
  Group,
  Badge,
  Grid,
  ThemeIcon,
  Paper,
  Divider,
  Box,
  SimpleGrid,
  ScrollArea,
  Title,
  Timeline,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  FaBoxOpen,
  FaCalendarAlt,
  FaCheckCircle,
  FaClipboardList,
  FaCogs,
  FaCut,
  FaDoorOpen,
  FaFire,
  FaIndustry,
  FaPaintBrush,
  FaRegCircle,
  FaShippingFast,
  FaTools,
  FaTruckLoading,
  FaUserTie,
  FaExternalLinkAlt,
} from "react-icons/fa";
import dayjs from "dayjs";
import { useSupabase } from "@/hooks/useSupabase";
import { Tables } from "@/types/db";
import Link from "next/link";

// Reuse existing components
import ClientInfo from "@/components/Shared/ClientInfo/ClientInfo";
import CabinetSpecs from "@/components/Shared/CabinetSpecs/CabinetSpecs";
import OrderDetails from "@/components/Shared/OrderDetails/OrderDetails";
import RelatedServiceOrders from "@/components/Shared/RelatedServiceOrders/RelatedServiceOrders";
import RelatedBackorders from "@/components/Shared/RelatedBO/RelatedBO";

// --- Types ---
type JoinedCabinet = Tables<"cabinets"> & {
  door_styles: { name: string } | null;
  species: { Species: string } | null;
  colors: { Name: string } | null;
};

type FullJobData = Tables<"jobs"> & {
  sales_orders:
    | (Tables<"sales_orders"> & {
        client: Tables<"client"> | null;
        cabinet: JoinedCabinet | null;
      })
    | null;
  production_schedule: Tables<"production_schedule"> | null;
  installation:
    | (Tables<"installation"> & {
        installer: Tables<"installers"> | null;
      })
    | null;
};

interface JobDetailsDrawerProps {
  jobId: number | null;
  opened: boolean;
  onClose: () => void;
}

// --- Helper Components ---

const SectionHeader = ({
  icon: Icon,
  title,
  color = "violet",
}: {
  icon: any;
  title: string;
  color?: string;
}) => (
  <Group mb="xs" gap="xs">
    <ThemeIcon size="sm" radius="md" variant="light" color={color}>
      <Icon size={12} />
    </ThemeIcon>
    <Text
      fw={700}
      size="xs"
      tt="uppercase"
      c="dimmed"
      style={{ letterSpacing: "0.5px" }}
    >
      {title}
    </Text>
  </Group>
);

const CompactDateBlock = ({
  label,
  date,
  color = "gray",
}: {
  label: string;
  date: string | null | undefined;
  color?: string;
}) => (
  <Box
    p={6}
    bg="gray.0"
    style={{
      borderRadius: 6,
      border: "1px solid #e9ecef",
      borderLeft: date
        ? `3px solid var(--mantine-color-${color}-5)`
        : undefined,
    }}
  >
    <Text size="10px" c="dimmed" fw={700} tt="uppercase">
      {label}
    </Text>
    <Text size="sm" fw={600} c={date ? "dark" : "dimmed"}>
      {date ? dayjs(date).format("MMM D") : "—"}
    </Text>
  </Box>
);

export default function JobDetailsDrawer({
  jobId,
  opened,
  onClose,
}: JobDetailsDrawerProps) {
  const { supabase, isAuthenticated } = useSupabase();

  // --- Data Fetching ---
  const { data: job, isLoading } = useQuery<FullJobData>({
    queryKey: ["job_quick_view", jobId],
    queryFn: async () => {
      if (!jobId) throw new Error("Job ID is required");
      const { data, error } = await supabase
        .from("jobs")
        .select(
          `
          *,
          sales_orders!fk_jobs_sales_order_id (
            *,
            client:client_id (*),
            cabinet:cabinet_id (
              *,
              door_styles(name),
              species(Species),
              colors(Name)
            )
          ),
          production_schedule:prod_id (*),
          installation:installation_id (
            *,
            installer:installer_id (*)
          )
        `
        )
        .eq("id", jobId)
        .single();

      if (error) throw error;
      return data as unknown as FullJobData;
    },
    enabled: isAuthenticated && !!jobId && opened,
  });

  // --- Derived State for Production Steps ---
  const productionSteps = [
    {
      key: "in_plant_actual",
      label: "In Plant",
      icon: FaIndustry,
    },
    {
      key: "doors_completed_actual",
      label: "Doors",
      icon: FaDoorOpen,
    },
    {
      key: "cut_finish_completed_actual",
      label: "Cut Fin",
      icon: FaCut,
    },
    {
      key: "custom_finish_completed_actual",
      label: "Custom Fin",
      icon: FaPaintBrush,
    },
    {
      key: "cut_melamine_completed_actual",
      label: "Cut Mel",
      icon: FaCut,
    },
    {
      key: "drawer_completed_actual",
      label: "Drawers",
      icon: FaCut,
    },
    {
      key: "paint_completed_actual",
      label: "Paint",
      icon: FaPaintBrush,
    },
    {
      key: "assembly_completed_actual",
      label: "Assembly",
      icon: FaCogs,
    },
  ] as const;

  // --- Render Content ---
  const renderContent = () => {
    if (isLoading)
      return (
        <Center h="100%">
          <Loader type="bars" color="violet" />
        </Center>
      );
    if (!job)
      return (
        <Center h="100%">
          <Text c="dimmed">Job not found.</Text>
        </Center>
      );

    const so = job.sales_orders;
    const cabinet = so?.cabinet;
    const prod = job.production_schedule;
    const install = job.installation;

    // Construct Address
    const address = [so?.shipping_street, so?.shipping_city, so?.shipping_zip]
      .filter(Boolean)
      .join(", ");

    return (
      <Stack gap="md" pb="xl">
        {/* --- HEADER --- */}
        <Paper p="md" radius="md" bg="gray.1">
          <Group justify="space-between" align="flex-start">
            <Group>
              <ThemeIcon
                size={50}
                radius="md"
                variant="gradient"
                gradient={{ from: "#8E2DE2", to: "#4A00E0", deg: 135 }}
              >
                <FaClipboardList size={24} />
              </ThemeIcon>
              <Stack gap={0}>
                <Group gap="xs">
                  <Title order={3}>Job #{job.job_number}</Title>
                  {prod?.rush && (
                    <Badge
                      color="red"
                      variant="filled"
                      leftSection={<FaFire />}
                    >
                      RUSH
                    </Badge>
                  )}
                </Group>
                <Text size="sm" c="dimmed" fw={500}>
                  {so?.shipping_client_name}
                </Text>
                {address && (
                  <Text size="xs" c="dimmed">
                    {address}
                  </Text>
                )}
              </Stack>
            </Group>

            {/* Quick Link to Edit Page */}
            <Tooltip label="Open Full Edit Page">
              <ActionIcon
                component={Link}
                href={`/dashboard/sales/editsale/${so?.id}`}
                variant="light"
                color="violet"
                size="lg"
                onClick={onClose}
              >
                <FaExternalLinkAlt size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Paper>

        {/* --- SECTION 1: SPECS --- */}
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Stack gap="xs">
            <ClientInfo
              shipping={{
                shipping_client_name: so?.shipping_client_name,
                shipping_phone_1: so?.shipping_phone_1,
                shipping_email_1: so?.shipping_email_1,
                shipping_street: so?.shipping_street,
                shipping_city: so?.shipping_city,
                shipping_zip: so?.shipping_zip,
              }}
            />
            <OrderDetails
              orderDetails={{
                order_type: so?.order_type,
                delivery_type: so?.delivery_type,
                install: so?.install,
              }}
            />
          </Stack>
          <CabinetSpecs cabinet={cabinet} />
        </SimpleGrid>

        {/* --- SECTION 2: PRODUCTION --- */}
        <Paper p="md" radius="md" withBorder shadow="sm">
          <SectionHeader
            icon={FaIndustry}
            title="Production Status"
            color="blue"
          />

          {/* Progress Strip */}
          <Group justify="space-between" mb="lg" wrap="nowrap" gap={4}>
            {productionSteps.map((step) => {
              const isDone = !!prod?.[step.key];
              return (
                <Stack
                  key={step.key}
                  gap={4}
                  align="center"
                  style={{ flex: 1 }}
                >
                  <ThemeIcon
                    size="lg"
                    radius="xl"
                    variant={isDone ? "filled" : "light"}
                    color={isDone ? "#009c2fff" : "gray"}
                  >
                    <step.icon size={14} />
                  </ThemeIcon>
                  <Text
                    size="10px"
                    c={isDone ? "dark" : "dimmed"}
                    fw={600}
                    ta="center"
                  >
                    {step.label}
                  </Text>
                </Stack>
              );
            })}
          </Group>

          <Divider mb="md" />

          {/* Schedule Grid */}
          <SimpleGrid cols={4} spacing="xs">
            <CompactDateBlock label="Received" date={prod?.received_date} />
            <CompactDateBlock label="Placement" date={prod?.placement_date} />
            <CompactDateBlock
              label="Ship Date"
              date={prod?.ship_schedule}
              color="blue"
            />
            <Box>
              <Text size="10px" c="dimmed" fw={700} tt="uppercase">
                Shipping Date Status
              </Text>
              <Badge
                size="sm"
                mt={2}
                variant="light"
                color={
                  prod?.ship_status === "confirmed"
                    ? "green"
                    : prod?.ship_status === "tentative"
                    ? "orange"
                    : "gray"
                }
              >
                {prod?.ship_status || "N/A"}
              </Badge>
            </Box>
          </SimpleGrid>
        </Paper>

        {/* --- SECTION 3: INSTALLATION & LOGISTICS --- */}
        <Paper p="md" radius="md" withBorder shadow="sm">
          <SectionHeader
            icon={FaShippingFast}
            title="Installation & Logistics"
            color="orange"
          />

          <Grid>
            <Grid.Col span={7}>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Installer:
                  </Text>
                  <Text size="sm" fw={600}>
                    {install?.installer?.company_name ||
                      install?.installer?.first_name ||
                      "Unassigned"}
                  </Text>
                </Group>

                <SimpleGrid cols={2} spacing="xs">
                  <CompactDateBlock
                    label="Install Date"
                    date={install?.installation_date}
                    color="orange"
                  />
                  <CompactDateBlock
                    label="Inspect Date"
                    date={install?.inspection_date}
                    color="cyan"
                  />
                </SimpleGrid>

                <Group gap="xs" mt={4}>
                  <Badge
                    variant={
                      install?.installation_completed ? "filled" : "outline"
                    }
                    color={install?.installation_completed ? "green" : "gray"}
                    leftSection={
                      install?.installation_completed ? (
                        <FaCheckCircle size={10} />
                      ) : (
                        <FaRegCircle size={10} />
                      )
                    }
                  >
                    Install Complete
                  </Badge>
                  <Badge
                    variant={
                      install?.inspection_completed ? "filled" : "outline"
                    }
                    color={install?.inspection_completed ? "blue" : "gray"}
                    leftSection={
                      install?.inspection_completed ? (
                        <FaCheckCircle size={10} />
                      ) : (
                        <FaRegCircle size={10} />
                      )
                    }
                  >
                    Inspect Complete
                  </Badge>
                </Group>
              </Stack>
            </Grid.Col>

            <Grid.Col span={5} style={{ borderLeft: "1px dashed #dee2e6" }}>
              <Stack gap="xs">
                <CompactDateBlock label="Wrap Date" date={install?.wrap_date} />
                <Box>
                  <Text size="10px" c="dimmed" fw={700} tt="uppercase" mb={4}>
                    Shipped?
                  </Text>
                  <Badge
                    color={install?.has_shipped ? "green" : "red"}
                    variant="light"
                    fullWidth
                  >
                    {install?.has_shipped ? "YES" : "NO"}
                  </Badge>
                  {install?.partially_shipped && (
                    <Badge
                      color="orange"
                      variant="outline"
                      fullWidth
                      mt={4}
                      size="xs"
                    >
                      Partial
                    </Badge>
                  )}
                </Box>
              </Stack>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* --- SECTION 4: RELATED ITEMS --- */}
        <RelatedServiceOrders jobId={jobId} readOnly />
        <RelatedBackorders jobId={String(jobId)} readOnly />
      </Stack>
    );
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="xl" // ~800px wide
      title={
        <Text fw={700} size="lg" c="violet">
          Job Quick View
        </Text>
      }
      overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
    >
      <ScrollArea h="calc(100vh - 80px)" type="hover">
        {renderContent()}
      </ScrollArea>
    </Drawer>
  );
}
