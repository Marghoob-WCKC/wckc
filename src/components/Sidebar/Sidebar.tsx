"use client";

import { usePathname } from "next/navigation";
import {
  Stack,
  Group,
  Code,
  Text,
  rem,
  useMantineTheme,
  Box,
  Tooltip,
} from "@mantine/core";
import Link from "next/link";
import { FaHome, FaUsers } from "react-icons/fa";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

type SidebarLink = {
  iconName: string;
  label: string;
  path: string;
};

type SidebarProps = {
  links: SidebarLink[];
};

const iconMap: Record<string, any> = {
  FaHome,
  FaUsers,
};

type MainLinkProps = SidebarLink & {
  active: boolean;
};

function MainLink({ iconName, label, path, active }: MainLinkProps) {
  const Icon = iconMap[iconName] || FaHome;

  return (
    <Link href={path} style={{ textDecoration: "none" }}>
      <Group
        p="xs"
        style={{
          borderRadius: 6,
          backgroundColor: active ? "rgba(255, 255, 255, 0.1)" : "transparent",
          color: active ? "#fff" : "rgba(255, 255, 255, 0.7)",
          cursor: "pointer",
          transition: "all 0.3s",
        }}
        onMouseEnter={(e) => {
          if (!active)
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
          if (!active) e.currentTarget.style.color = "#fff";
        }}
        onMouseLeave={(e) => {
          if (!active) e.currentTarget.style.background = "transparent";
          if (!active) e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
        }}
      >
        <Box
          style={{
            width: rem(18),
            height: rem(18),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon style={{ width: rem(18), height: rem(18) }} />
        </Box>

        <Text size="sm" fw={active ? 600 : 400}>
          {label}
        </Text>
      </Group>
    </Link>
  );
}

export default function Sidebar({ links }: SidebarProps) {
  const pathname = usePathname();
  const theme = useMantineTheme();

  return (
    <Box
      style={{
        width: rem(200),
        height: "100vh", // FORCE exact viewport height
        overflowY: "auto", // PREVENT overflow issues
        background: "linear-gradient(180deg, #7b2ff7, #2b86c5)",
        borderRight: `1px solid ${theme.colors.gray[3]}`,
        display: "flex",
        flexDirection: "column",
        padding: theme.spacing.md,
      }}
    >
      {/* Logo */}
      <Group justify="space-between" mb="lg">
        <Text fz="lg" fw={700} style={{ color: "white" }}>
          WCKC Tracker
        </Text>
      </Group>

      {/* Links */}
      <Stack style={{ flexGrow: 1 }}>
        {links.map((link) => (
          <MainLink
            key={link.label}
            {...link}
            active={pathname === link.path}
          />
        ))}
      </Stack>

      {/* Clerk Auth Buttons (bottom) */}
      <Box mt="auto" pt="lg">
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UserButton showName={true} />
        </SignedIn>
      </Box>
    </Box>
  );
}
