"use client";

import { Box, Paper, Text, Timeline, Center } from "@mantine/core";
import {
  FaCheckCircle,
  FaCogs,
  FaCut,
  FaDoorOpen,
  FaIndustry,
  FaPaintBrush,
  FaRegCircle,
  FaCalendarCheck,
} from "react-icons/fa";
import dayjs from "dayjs";
import { useMemo } from "react";
import { Tables } from "@/types/db";

// Define the keys we care about
type ActualKey =
  | "in_plant_actual"
  | "in_plant_cabinets_actual"
  | "doors_completed_actual"
  | "cut_finish_completed_actual"
  | "custom_finish_completed_actual"
  | "drawer_completed_actual"
  | "cut_melamine_completed_actual"
  | "paint_completed_actual"
  | "assembly_completed_actual";

const STEPS_CONFIG: {
  key: ActualKey;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "in_plant_actual",
    label: "In Plant (Doors)",
    icon: <FaIndustry size={12} />,
  },
  {
    key: "in_plant_cabinets_actual",
    label: "In Plant (Cabinets)",
    icon: <FaIndustry size={12} />,
  },
  {
    key: "doors_completed_actual",
    label: "Doors",
    icon: <FaDoorOpen size={12} />,
  },
  {
    key: "cut_finish_completed_actual",
    label: "Cut Finishing",
    icon: <FaCut size={12} />,
  },
  {
    key: "custom_finish_completed_actual",
    label: "Custom Finish",
    icon: <FaCut size={12} />,
  },
  {
    key: "drawer_completed_actual",
    label: "Drawers",
    icon: <FaDoorOpen size={12} />,
  },
  {
    key: "cut_melamine_completed_actual",
    label: "Melamine Cut",
    icon: <FaCut size={12} />,
  },
  {
    key: "paint_completed_actual",
    label: "Paint",
    icon: <FaPaintBrush size={12} />,
  },
  {
    key: "assembly_completed_actual",
    label: "Assembly",
    icon: <FaCogs size={12} />,
  },
];

interface PlantActualsProps {
  schedule: Partial<Tables<"production_schedule">> | null | undefined;
  title?: string;
}

export default function PlantActuals({
  schedule,
  title = "Plant Progress",
}: PlantActualsProps) {
  const steps = useMemo(() => {
    if (!schedule) return [];

    return STEPS_CONFIG.map((step) => ({
      ...step,
      isCompleted: !!schedule[step.key],
      date: schedule[step.key] as string | null,
    }));
  }, [schedule]);

  if (!schedule) return null;

  return (
    <Paper p="md" radius="md" w="100%" h="100%">
      <Center>
        <Text
          fw={600}
          size="lg"
          mb="lg"
          c="violet"
          display="flex"
          style={{ alignItems: "center" }}
        >
          <FaCalendarCheck style={{ marginRight: 8 }} /> {title}
        </Text>
      </Center>
      <Timeline
        bulletSize={24}
        lineWidth={2}
        active={-1}
        styles={{ root: { "--tl-color": "green" } }}
      >
        {steps.map((step, idx) => {
          const bulletColor = step.isCompleted ? "#28a745" : "#6b6b6b";
          const lineColor = step.isCompleted ? "#28a745" : "#e0e0e0";

          return (
            <Timeline.Item
              key={idx}
              title={step.label}
              lineVariant="solid"
              bullet={
                <Box
                  style={{
                    backgroundColor: bulletColor,
                    borderRadius: "50%",
                    width: 24,
                    height: 24,
                    minWidth: 24,
                    minHeight: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    aspectRatio: "1 / 1",
                  }}
                >
                  {step.isCompleted ? (
                    <FaCheckCircle size={12} color="white" />
                  ) : (
                    step.icon
                  )}
                </Box>
              }
              styles={{
                item: { "--tl-color": lineColor },
                itemTitle: {
                  color: step.isCompleted ? "#28a745" : "#6b6b6b",
                },
              }}
            >
              <Text size="xs" c="dimmed">
                {step.isCompleted ? "Completed:" : "Pending"}
              </Text>

              {step.date === "1999-09-19T00:00:00+00:00" ? (
                <Text size="sm" c="green.8" fw={600}>
                  Completed
                </Text>
              ) : (
                <Text size="sm" fw={500}>
                  {step.date ? dayjs(step.date).format("MMM D, HH:mm") : "—"}
                </Text>
              )}
            </Timeline.Item>
          );
        })}
      </Timeline>
    </Paper>
  );
}
