"use client";

import { usePathname } from "next/navigation";
import {
  Stack,
  Group,
  Text,
  rem,
  useMantineTheme,
  Box,
  Collapse,
  UnstyledButton,
  Center,
  Tooltip,
  Menu,
  ActionIcon,
  Code,
} from "@mantine/core";
import { useState, useEffect } from "react";
import { useMediaQuery } from "@mantine/hooks";
import {
  FaHome,
  FaUsers,
  FaShippingFast,
  FaTools,
  FaShoppingBag,
  FaFileInvoice,
  FaChevronRight,
  FaCalendarAlt,
  FaClipboardCheck,
  FaTruckLoading,
  FaBoxOpen,
  FaChevronLeft,
} from "react-icons/fa";
import { FaGears, FaBarsStaggered } from "react-icons/fa6";
import { MdFactory, MdFeedback, MdSupervisorAccount } from "react-icons/md";
import { GoTools } from "react-icons/go";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { GrSchedules } from "react-icons/gr";

import { useNavigationGuard } from "@/providers/NavigationGuardProvider";
import TopNavigationBar from "../Shared/TopNavigationBar/TopNavigationBar";
import Link from "next/link";
import { colors, linearGradients } from "@/theme";

export type SidebarLink = {
  iconName: string;
  label: string;
  path?: string;
  links?: SidebarLink[];
  permission?: boolean;
};

type SidebarProps = {
  links: SidebarLink[];
};

const iconMap: Record<string, any> = {
  FaHome,
  FaUsers,
  FaGears,
  FaShippingFast,
  FaTools,
  MdFactory,
  GoTools,
  FaShoppingBag,
  FaFileInvoice,
  FaCalendarAlt,
  FaClipboardCheck,
  FaTruckLoading,
  MdSupervisorAccount,
  GrSchedules,
  FaBoxOpen,
  MdFeedback,
};

function MainLink({
  item,
  collapsed,
}: {
  item: SidebarLink;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const Icon = iconMap[item.iconName] || FaHome;
  const hasLinks = Array.isArray(item.links) && item.links.length > 0;
  const { navigatePush } = useNavigationGuard();

  const isActive = item.path
    ? pathname === item.path ||
      (item.path !== "/dashboard" && pathname.startsWith(item.path))
    : false;
  const isChildActive = hasLinks
    ? item.links?.some((link) => pathname === link.path) ?? false
    : false;

  const [opened, setOpened] = useState(isChildActive);

  useEffect(() => {
    if (isChildActive && !collapsed) setOpened(true);
  }, [isChildActive, collapsed]);

  const navItemStyle = {
    borderRadius: 6,
    backgroundColor:
      isActive || isChildActive ? "rgba(255, 255, 255, 0.15)" : "transparent",
    color: isActive || isChildActive ? "#fff" : "rgba(255, 255, 255, 0.7)",
    cursor: "pointer",
    width: "100%",
    minHeight: rem(40),
    display: "flex",
    alignItems: "center",
    transition: "background 150ms ease",
  };

  if (collapsed) {
    if (hasLinks) {
      return (
        <Menu
          position="right-start"
          offset={10}
          trigger="hover"
          openDelay={0}
          closeDelay={50}
          withinPortal
          transitionProps={{ transition: "fade", duration: 100 }}
        >
          <Menu.Target>
            <UnstyledButton p="xs" style={navItemStyle}>
              <Center style={{ width: "100%" }}>
                <Icon size={20} />
              </Center>
            </UnstyledButton>
          </Menu.Target>
          <Menu.Dropdown
            style={{
              backgroundColor: colors.violet.primary,
              border: `1px solid ${colors.violet.light}`,
              boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
              zIndex: 1000,
            }}
          >
            <Menu.Label
              style={{ color: "white", opacity: 0.7, fontWeight: 700 }}
            >
              {item.label}
            </Menu.Label>
            {item.links?.map((link) => {
              const SubIcon = iconMap[link.iconName] || FaHome;
              return (
                <Menu.Item
                  key={link.label}
                  leftSection={<SubIcon size={14} />}
                  onClick={() => link.path && navigatePush(link.path)}
                  style={{
                    color:
                      pathname === link.path ? "#fff" : "rgba(255,255,255,0.8)",
                    backgroundColor:
                      pathname === link.path
                        ? "rgba(255,255,255,0.1)"
                        : "transparent",
                  }}
                >
                  {link.label}
                </Menu.Item>
              );
            })}
          </Menu.Dropdown>
        </Menu>
      );
    }

    return (
      <Tooltip label={item.label} position="right" withArrow openDelay={200}>
        <UnstyledButton
          p="xs"
          style={navItemStyle}
          onClick={() => item.path && navigatePush(item.path)}
        >
          <Center style={{ width: "100%" }}>
            <Icon size={20} />
          </Center>
        </UnstyledButton>
      </Tooltip>
    );
  }

  return (
    <>
      <UnstyledButton
        onClick={() =>
          hasLinks ? setOpened((o) => !o) : item.path && navigatePush(item.path)
        }
        p="xs"
        style={navItemStyle}
      >
        <Group justify="space-between" wrap="nowrap" style={{ width: "100%" }}>
          <Group gap="sm" wrap="nowrap">
            <Icon size={18} />
            <Text
              size="sm"
              fw={isActive || isChildActive ? 600 : 400}
              style={{ whiteSpace: "nowrap" }}
            >
              {item.label}
            </Text>
          </Group>
          {hasLinks && (
            <FaChevronRight
              size={10}
              style={{
                transform: opened ? "rotate(90deg)" : "none",
                transition: "transform 200ms ease",
                flexShrink: 0,
              }}
            />
          )}
        </Group>
      </UnstyledButton>
      {hasLinks && (
        <Collapse in={opened}>
          <Stack
            gap={2}
            mt={4}
            pl={20}
            style={{
              borderLeft: "1px solid rgba(255,255,255,0.1)",
              marginLeft: rem(12),
            }}
          >
            {item.links?.map((link) => (
              <MainLink key={link.label} item={link} collapsed={collapsed} />
            ))}
          </Stack>
        </Collapse>
      )}
    </>
  );
}

export default function Sidebar({ links }: SidebarProps) {
  const isSmallScreen = useMediaQuery("(max-width: 1024px)");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(!!isSmallScreen);
  }, [isSmallScreen]);

  const width = collapsed ? rem(70) : rem(240);

  return (
    <Box
      component="nav"
      style={{
        width: width,
        minWidth: width,
        height: "100vh",
        background: linearGradients.primaryVertical,
        display: "flex",
        flexDirection: "column",
        transition: "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
        position: "sticky",
        top: 0,
        left: 0,
        zIndex: 100,
        overflow: "hidden",
      }}
    >
      <Box p="md" style={{ overflow: "hidden" }}>
        <Group
          justify={collapsed ? "center" : "space-between"}
          mb="lg"
          wrap="nowrap"
        >
          {!collapsed && (
            <Text
              fz="lg"
              fw={800}
              style={{ color: "white", whiteSpace: "nowrap" }}
            >
              WCKC Tracker{" "}
              <Code
                style={{
                  fontSize: "8px",
                  color: "#fff",
                  backgroundColor: "#5700bbff",
                }}
              >
                v1.0.0
              </Code>
            </Text>
          )}
          <ActionIcon
            variant="subtle"
            color="white"
            onClick={() => setCollapsed(!collapsed)}
            size="lg"
            style={{ flexShrink: 0 }}
          >
            {collapsed ? (
              <FaBarsStaggered size={18} />
            ) : (
              <FaChevronLeft size={14} />
            )}
          </ActionIcon>
        </Group>

        <Box
          style={{
            height: rem(50),
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transition: "all 250ms ease",
          }}
        >
          <TopNavigationBar />
        </Box>
      </Box>

      <Stack
        gap={4}
        px="md"
        style={{
          flexGrow: 1,
          overflowY: "auto",
          overflowX: "hidden",
          scrollbarWidth: "none",
        }}
      >
        {links.map(
          (link) =>
            !link.permission && (
              <MainLink key={link.label} item={link} collapsed={collapsed} />
            )
        )}
      </Stack>

      <Box p="md" mt="auto">
        <SignedIn>
          <UserButton
            showName={!collapsed}
            appearance={{
              elements: {
                rootBox: { width: "100%" },
                userButtonTrigger: {
                  width: "100%",
                  justifyContent: "center",
                  background: linearGradients.lightViolet,
                  padding: collapsed ? "8px 0" : "8px 12px",
                  borderRadius: "8px",
                  transition: "padding 250ms ease",
                },
                userButtonOuterIdentifier: {
                  color: colors.violet.primary,
                  fontWeight: 700,
                  display: collapsed ? "none" : "block",
                },
              },
            }}
          />
        </SignedIn>
      </Box>
    </Box>
  );
}
