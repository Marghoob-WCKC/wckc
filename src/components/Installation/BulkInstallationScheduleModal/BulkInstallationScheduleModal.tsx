import { useState, useMemo } from "react";
import {
  Modal,
  Button,
  Group,
  Select,
  Stack,
  Text,
  SimpleGrid,
  Switch,
  Divider,
  Box,
  ThemeIcon,
  Badge,
  ScrollArea,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/hooks/useSupabase";
import {
  FaBoxOpen,
  FaCalendarCheck,
  FaCheckCircle,
  FaShippingFast,
  FaTools,
  FaTruckLoading,
} from "react-icons/fa";
import dayjs from "dayjs";
import {
  useBulkSchedule,
  BulkSchedulePayload,
} from "@/hooks/useBulkInstallationSchedule";

interface BulkScheduleModalProps {
  opened: boolean;
  onClose: () => void;
  selectedRows: any[];
  clearSelection: () => void;
}

export default function BulkScheduleModal({
  opened,
  onClose,
  selectedRows,
  clearSelection,
}: BulkScheduleModalProps) {
  const { supabase } = useSupabase();
  const { mutate, isPending } = useBulkSchedule();

  // --- Local State for Form Fields ---
  const [updates, setUpdates] = useState<Partial<BulkSchedulePayload>>({});

  // --- Completion Modal State ---
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [completionDateInput, setCompletionDateInput] = useState<Date | null>(
    new Date()
  );
  const [targetCompletionField, setTargetCompletionField] = useState<
    "installation_completed" | null
  >(null);

  // --- Fetch Installers ---
  const { data: installers } = useQuery({
    queryKey: ["installers-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("installers")
        .select("installer_id, company_name, first_name, last_name")
        .eq("is_active", true)
        .order("company_name");
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const installerOptions = useMemo(() => {
    return (installers || []).map((i) => ({
      value: String(i.installer_id),
      label: i.company_name || `${i.first_name} ${i.last_name}`,
    }));
  }, [installers]);

  // --- Handlers ---
  const handleUpdate = (key: keyof BulkSchedulePayload, value: any) => {
    setUpdates((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const ids = selectedRows
      .map((row) => row.original.installation_id)
      .filter((id) => id !== null) as number[];

    mutate(
      { installationIds: ids, ...updates },
      {
        onSuccess: () => {
          clearSelection();
          handleClose();
        },
      }
    );
  };

  const handleClose = () => {
    setUpdates({});
    onClose();
  };

  // --- Completion Logic ---
  const openCompletionModal = (field: "installation_completed") => {
    setTargetCompletionField(field);
    setCompletionDateInput(new Date());
    setCompletionModalOpen(true);
  };

  const confirmCompletionDate = () => {
    if (targetCompletionField && completionDateInput) {
      // FIX: Set time to Noon (12:00) to prevent timezone shifts (e.g. UTC-5)
      // from rolling the date back to the previous day when converting to ISO/UTC.
      const safeDate = dayjs(completionDateInput)
        .hour(12)
        .minute(0)
        .second(0)
        .toISOString();

      handleUpdate(targetCompletionField, safeDate);
      setCompletionModalOpen(false);
      setTargetCompletionField(null);
    }
  };

  // Extract job numbers for display
  const selectedJobNumbers = useMemo(() => {
    return selectedRows.map((row) => row.original.job_number).filter(Boolean);
  }, [selectedRows]);

  return (
    <>
      <Modal
        opened={opened}
        onClose={handleClose}
        title={
          <Group>
            <ThemeIcon variant="light" color="violet" size="lg">
              <FaCalendarCheck />
            </ThemeIcon>
            <Text fw={600}>Bulk Schedule ({selectedRows.length} Jobs)</Text>
          </Group>
        }
        size="lg"
      >
        <Stack gap="lg">
          {/* Selected Job Numbers Display */}
          <Box>
            <Text size="sm" fw={500} mb={4}>
              Selected Jobs:
            </Text>
            <ScrollArea h={selectedJobNumbers.length > 10 ? 60 : "auto"}>
              <Group gap={6}>
                {selectedJobNumbers.map((jobNum) => (
                  <Badge key={jobNum} variant="light" color="gray">
                    {jobNum}
                  </Badge>
                ))}
              </Group>
            </ScrollArea>
          </Box>

          <Text size="sm" c="dimmed" mb={-10}>
            Adjust fields below. Leave empty to keep existing values.
          </Text>

          {/* 1. Installer & Key Dates */}
          <Box>
            <Group mb="xs" c="violet.9">
              <FaTools />{" "}
              <Text fw={600} size="sm">
                Assignment & Dates
              </Text>
            </Group>
            <SimpleGrid cols={2}>
              <Select
                label="Assigned Installer"
                placeholder="No Change"
                data={installerOptions}
                searchable
                clearable
                onChange={(val) =>
                  handleUpdate("installer_id", val ? Number(val) : null)
                }
              />
              <DateInput
                label="Scheduled Installation"
                placeholder="No Change"
                clearable
                valueFormat="YYYY-MM-DD"
                // For standard dates (stored as YYYY-MM-DD date type), standard Date object is fine
                // as the hook formats it as YYYY-MM-DD string directly.
                onChange={(val) => handleUpdate("installation_date", val)}
              />
              <DateInput
                label="Scheduled Inspection"
                placeholder="No Change"
                clearable
                valueFormat="YYYY-MM-DD"
                onChange={(val) => handleUpdate("inspection_date", val)}
              />
            </SimpleGrid>
          </Box>

          <Divider />

          {/* 2. Shipping Management */}
          <Box>
            <Group mb="xs" c="green.9">
              <FaTruckLoading />{" "}
              <Text fw={600} size="sm">
                Shipping & Wrap
              </Text>
            </Group>
            <SimpleGrid cols={2}>
              <DateInput
                label="Wrap Date"
                placeholder="No Change"
                clearable
                valueFormat="YYYY-MM-DD"
                onChange={(val) => handleUpdate("wrap_date", val)}
              />
              <DateInput
                label="Shipping Date"
                placeholder="No Change"
                clearable
                valueFormat="YYYY-MM-DD"
                onChange={(val) => handleUpdate("ship_schedule", val)}
              />
              <Select
                label="Shipping Status"
                placeholder="No Change"
                data={["unprocessed", "tentative", "confirmed"]}
                onChange={(val) => handleUpdate("ship_status", val)}
              />
            </SimpleGrid>
            <Group mt="md" grow>
              {/* Wrapped Switch */}
              <Box>
                <Switch
                  size="md"
                  label="Mark as Wrapped"
                  thumbIcon={<FaBoxOpen size={10} />}
                  checked={
                    updates.wrap_completed !== undefined &&
                    updates.wrap_completed !== null
                  }
                  onChange={(e) =>
                    handleUpdate(
                      "wrap_completed",
                      e.currentTarget.checked ? new Date().toISOString() : null
                    )
                  }
                  styles={{ track: { cursor: "pointer" } }}
                />
                <Text size="xs" c="dimmed">
                  {updates.wrap_completed
                    ? "Set to 'Wrapped'"
                    : updates.wrap_completed === null
                    ? "Set to 'Not Wrapped'"
                    : "No Change"}
                </Text>
              </Box>

              {/* Shipped Switch */}
              <Box>
                <Switch
                  size="md"
                  label="Mark as Shipped"
                  thumbIcon={<FaShippingFast size={10} />}
                  checked={updates.has_shipped === true}
                  onChange={(e) =>
                    handleUpdate("has_shipped", e.currentTarget.checked)
                  }
                  styles={{ track: { cursor: "pointer" } }}
                />
                <Text size="xs" c="dimmed">
                  {updates.has_shipped === true
                    ? "Set to 'Shipped'"
                    : updates.has_shipped === false
                    ? "Set to 'Not Shipped'"
                    : "No Change"}
                </Text>
              </Box>
            </Group>
          </Box>

          <Divider />

          {/* 3. Completion Phase */}
          <Box>
            <Group mb="xs" c="blue.9">
              <FaCheckCircle />{" "}
              <Text fw={600} size="sm">
                Completion Sign-off
              </Text>
            </Group>
            <Group grow>
              <Button
                variant={updates.installation_completed ? "light" : "default"}
                color={updates.installation_completed ? "green" : "gray"}
                onClick={() => openCompletionModal("installation_completed")}
              >
                {updates.installation_completed
                  ? `Inst. Completed: ${dayjs(
                      updates.installation_completed
                    ).format("YYYY-MM-DD")}`
                  : "Set Installation Completion"}
              </Button>
            </Group>
            {updates.installation_completed && (
              <Button
                variant="subtle"
                color="red"
                size="compact-xs"
                onClick={() => {
                  handleUpdate("installation_completed", undefined);
                }}
              >
                Reset Completion Changes
              </Button>
            )}
          </Box>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              loading={isPending}
              onClick={handleSave}
              color="violet"
              disabled={Object.keys(updates).length === 0}
            >
              Apply Changes
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Helper Modal for Completion Dates */}
      <Modal
        opened={completionModalOpen}
        onClose={() => setCompletionModalOpen(false)}
        title="Set Completion Date"
        centered
        size="sm"
        zIndex={201}
      >
        <Stack>
          <DateInput
            label="Select Date"
            placeholder="Pick a date"
            value={completionDateInput}
            onChange={(date) =>
              setCompletionDateInput(date ? new Date(date) : null)
            }
            valueFormat="YYYY-MM-DD"
            data-autofocus
          />
          <Group justify="flex-end" mt="md">
            <Button
              variant="default"
              onClick={() => setCompletionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmCompletionDate} color="green">
              Confirm
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
