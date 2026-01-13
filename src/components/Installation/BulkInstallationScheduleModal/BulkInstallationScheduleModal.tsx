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
  TextInput,
  Textarea,
  Collapse,
  Grid,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/hooks/useSupabase";
import {
  FaCheckCircle,
  FaShippingFast,
  FaTools,
  FaTruckLoading,
  FaClipboardList,
  FaExclamationTriangle,
  FaBoxOpen,
  FaCalendarCheck,
} from "react-icons/fa";
import { colors, gradients } from "@/theme";
import AddBackorderModal from "@/components/Installation/AddBOModal/AddBOModal";
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

  const [updates, setUpdates] = useState<Partial<BulkSchedulePayload>>({});

  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [completionDateInput, setCompletionDateInput] = useState<Date | null>(
    new Date()
  );
  const [targetCompletionField, setTargetCompletionField] = useState<
    "installation_completed" | null
  >(null);

  const [isBackorderPromptOpen, setIsBackorderPromptOpen] = useState(false);
  const [isAddBackorderModalOpen, setIsAddBackorderModalOpen] = useState(false);

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
    return (installers || []).map((i) => {
      const fullName = [i.first_name, i.last_name].filter(Boolean).join(" ");
      let label = fullName;
      if (i.company_name) {
        label = fullName ? `${i.company_name} (${fullName})` : i.company_name;
      }
      return {
        value: String(i.installer_id),
        label: label || "Unknown Installer",
      };
    });
  }, [installers]);

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

  const openCompletionModal = (field: "installation_completed") => {
    setTargetCompletionField(field);
    setCompletionDateInput(dayjs().toDate());
    setCompletionModalOpen(true);
  };

  const confirmCompletionDate = () => {
    if (targetCompletionField && completionDateInput) {
      const safeDate = dayjs(completionDateInput).format("YYYY-MM-DD");
      handleUpdate(targetCompletionField, safeDate);
      setCompletionModalOpen(false);
      setTargetCompletionField(null);
    }
  };

  const selectedJobNumbers = useMemo(() => {
    return selectedRows.map((row) => row.original.job_number).filter(Boolean);
  }, [selectedRows]);

  const selectedJobIds = useMemo(() => {
    return selectedRows
      .map((row) => row.original.id)
      .filter((id) => typeof id === "number");
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
        size="80%"
      >
        <Stack gap="lg">
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

          <Grid gutter="xl">
            <Grid.Col span={8}>
              <Stack gap="xl">
                <Box>
                  <Group mb="sm" c="violet.9" align="center">
                    <ThemeIcon color="violet" variant="light" size="md">
                      <FaTools size={14} />
                    </ThemeIcon>
                    <Text fw={700} size="md">
                      Assignment & Installation
                    </Text>
                  </Group>
                  <SimpleGrid cols={2} spacing="lg">
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

                <Divider variant="dashed" />

                <Box>
                  <Group mb="sm" c="green.9" align="center">
                    <ThemeIcon color="green" variant="light" size="md">
                      <FaTruckLoading size={14} />
                    </ThemeIcon>
                    <Text fw={700} size="md">
                      Shipping & Wrap
                    </Text>
                  </Group>
                  <SimpleGrid cols={3} spacing="lg">
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
                      label="Shipping Date Status"
                      placeholder="No Change"
                      data={["unprocessed", "tentative", "confirmed"]}
                      onChange={(val) => handleUpdate("ship_status", val)}
                    />
                  </SimpleGrid>
                </Box>

                <Box>
                  {updates.site_changes && (
                    <Textarea
                      label="Site Changes Detail"
                      placeholder="Enter details..."
                      minRows={3}
                      onChange={(e) =>
                        handleUpdate(
                          "site_changes_detail",
                          e.currentTarget.value
                        )
                      }
                    />
                  )}
                </Box>
              </Stack>
            </Grid.Col>

            <Grid.Col span={4} style={{ borderLeft: "1px solid #eee" }}>
              <Stack gap="md">
                <Text size="sm" fw={700} c="dimmed" mb={-8}>
                  Status Updates
                </Text>

                <Group justify="space-between">
                  <Switch
                    size="md"
                    color="violet"
                    label="Wrapped"
                    checked={
                      updates.wrap_completed !== undefined &&
                      updates.wrap_completed !== null
                    }
                    onChange={(e) =>
                      handleUpdate(
                        "wrap_completed",
                        e.currentTarget.checked
                          ? new Date().toISOString()
                          : null
                      )
                    }
                    styles={{ label: { fontWeight: 500 } }}
                  />
                </Group>

                <Divider variant="dashed" />

                <Switch
                  size="md"
                  color={updates.partially_shipped ? "orange" : "violet"}
                  label={
                    updates.partially_shipped ? "Shipped (Partial)" : "Shipped"
                  }
                  checked={
                    updates.has_shipped === true ||
                    updates.partially_shipped === true
                  }
                  onChange={(e) => {
                    const isChecked = e.currentTarget.checked;
                    if (isChecked) {
                      setIsBackorderPromptOpen(true);
                    } else {
                      handleUpdate("has_shipped", undefined);
                      handleUpdate("partially_shipped", undefined);
                    }
                  }}
                  styles={{
                    label: {
                      fontWeight: 500,
                      color: updates.partially_shipped ? "orange" : undefined,
                    },
                  }}
                />

                <Divider variant="dashed" />

                <Group justify="space-between">
                  <Switch
                    size="md"
                    color="violet"
                    label="Installation Completed"
                    checked={
                      updates.installation_completed !== undefined &&
                      updates.installation_completed !== null
                    }
                    onChange={() =>
                      openCompletionModal("installation_completed")
                    }
                    styles={{ label: { fontWeight: 500 } }}
                  />
                  {updates.installation_completed && (
                    <Button
                      variant="subtle"
                      color="red"
                      size="compact-xs"
                      onClick={() =>
                        handleUpdate("installation_completed", undefined)
                      }
                    >
                      Reset
                    </Button>
                  )}
                </Group>

                <Divider variant="dashed" />

                <Group justify="space-between">
                  <Switch
                    size="md"
                    color="violet"
                    label="Report Received"
                    checked={
                      updates.installation_report_received !== undefined &&
                      updates.installation_report_received !== null
                    }
                    onChange={(e) =>
                      handleUpdate(
                        "installation_report_received",
                        e.currentTarget.checked
                          ? new Date().toISOString()
                          : null
                      )
                    }
                    styles={{ label: { fontWeight: 500 } }}
                  />
                </Group>

                <Divider variant="dashed" />

                <Group justify="space-between">
                  <Switch
                    size="md"
                    color="violet"
                    label="Trade (30 Days)"
                    checked={
                      updates.trade_30days !== undefined &&
                      updates.trade_30days !== null
                    }
                    onChange={(e) =>
                      handleUpdate(
                        "trade_30days",
                        e.currentTarget.checked
                          ? new Date().toISOString()
                          : null
                      )
                    }
                    styles={{ label: { fontWeight: 500 } }}
                  />
                </Group>

                <Divider variant="dashed" />

                <Group justify="space-between">
                  <Switch
                    size="md"
                    color="violet"
                    label="Trade (6 Months)"
                    checked={
                      updates.trade_6months !== undefined &&
                      updates.trade_6months !== null
                    }
                    onChange={(e) =>
                      handleUpdate(
                        "trade_6months",
                        e.currentTarget.checked
                          ? new Date().toISOString()
                          : null
                      )
                    }
                    styles={{ label: { fontWeight: 500 } }}
                  />
                </Group>

                <Divider variant="dashed" />

                <Group justify="space-between">
                  <Switch
                    size="md"
                    color="violet"
                    label="Site Changes"
                    checked={
                      updates.site_changes !== undefined &&
                      updates.site_changes !== null
                    }
                    onChange={(e) =>
                      handleUpdate(
                        "site_changes",
                        e.currentTarget.checked
                          ? new Date().toISOString()
                          : null
                      )
                    }
                    styles={{ label: { fontWeight: 500 } }}
                  />
                </Group>
              </Stack>
            </Grid.Col>
          </Grid>

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
              setCompletionDateInput(date ? dayjs(date).toDate() : null)
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

      <Modal
        opened={isBackorderPromptOpen}
        onClose={() => {
          setIsBackorderPromptOpen(false);
        }}
        withCloseButton={false}
        centered
        radius="lg"
        padding="lg"
        overlayProps={{ blur: 4, opacity: 0.55 }}
        transitionProps={{ transition: "pop", duration: 200 }}
      >
        <Stack align="center" gap="md">
          <ThemeIcon
            size={80}
            radius="100%"
            variant="gradient"
            gradient={gradients.primary}
            style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}
          >
            <FaTruckLoading size={36} color="white" />
          </ThemeIcon>
          <Stack gap={4} align="center">
            <Text size="lg" fw={700} ta="center">
              Confirm Shipment Status
            </Text>
            <Text size="sm" c="dimmed" ta="center" style={{ maxWidth: 300 }}>
              Is this a complete shipment, or are items missing?
            </Text>
          </Stack>
          <Stack w="100%" gap="sm" mt="md">
            <Button
              fullWidth
              variant="gradient"
              gradient={gradients.success}
              size="md"
              radius="md"
              leftSection={<FaCheckCircle />}
              onClick={() => {
                setIsBackorderPromptOpen(false);
                handleUpdate("has_shipped", true);
                handleUpdate("partially_shipped", false);
              }}
              styles={{ root: { transition: "transform 0.2s" } }}
            >
              Complete Shipment
            </Button>
            <SimpleGrid cols={2}>
              <Button
                variant="outline"
                color={colors.orange.primary}
                size="sm"
                radius="md"
                leftSection={<FaClipboardList />}
                style={{
                  borderColor: colors.orange.primary,
                  color: colors.orange.primary,
                  fontSize: "12px",
                }}
                onClick={() => {
                  setIsBackorderPromptOpen(false);
                  handleUpdate("has_shipped", false);
                  handleUpdate("partially_shipped", true);
                  setIsAddBackorderModalOpen(true);
                }}
              >
                Partial (Log Backorder)
              </Button>
              <Button
                variant="subtle"
                color="gray"
                size="sm"
                radius="md"
                leftSection={<FaExclamationTriangle />}
                style={{
                  borderColor: colors.gray.title,
                  color: colors.gray.title,
                  fontSize: "12px",
                }}
                onClick={() => {
                  setIsBackorderPromptOpen(false);
                  handleUpdate("has_shipped", false);
                  handleUpdate("partially_shipped", true);
                }}
              >
                Partial (Mark Only)
              </Button>
            </SimpleGrid>
          </Stack>
          <Text
            size="xs"
            c="dimmed"
            style={{ cursor: "pointer", textDecoration: "underline" }}
            onClick={() => {
              setIsBackorderPromptOpen(false);
            }}
          >
            Cancel
          </Text>
        </Stack>
      </Modal>

      <AddBackorderModal
        opened={isAddBackorderModalOpen}
        onClose={() => setIsAddBackorderModalOpen(false)}
        jobId=""
        jobNumber=""
        isBulk={true}
        jobIds={selectedJobIds}
        onSuccess={() => {
          handleUpdate("partially_shipped", true);
          handleUpdate("has_shipped", false);
        }}
      />
    </>
  );
}
