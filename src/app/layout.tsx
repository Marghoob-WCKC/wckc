"use client";
import "./globals.css";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/core/styles/baseline.css";
import "@mantine/core/styles/default-css-variables.css";
import "@mantine/core/styles/global.css";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/tiptap/styles.css";
import "@mantine/dropzone/styles.css";

import { MantineProvider, mantineHtmlProps } from "@mantine/core";

import { ClerkProvider } from "@clerk/nextjs";
import { Notifications } from "@mantine/notifications";
import localFont from "next/font/local";
import QueryProvider from "@/components/providers/QueryProvider";
import ClerkTokenProvider from "@/providers/ClerkTokenProvider";
import SupabaseProvider from "@/providers/SupabaseProvider";
import Sidebar, { SidebarLink } from "@/components/Sidebar/Sidebar";
import { usePathname } from "next/navigation";
import NavigationGuardProvider from "@/providers/NavigationGuardProvider";

const Quicksand = localFont({
  src: "../../public/Fonts/Quicksand/Quicksand-Regular.ttf",
});

const dashboardLinks: SidebarLink[] = [
  {
    iconName: "MdSupervisorAccount",
    label: "Overview",
    path: "/dashboard",
  },
  {
    iconName: "FaHome",
    label: "Sales",
    path: "/dashboard/sales",
    allowedRoles: ["designer", "admin", "manager"],
  },
  {
    iconName: "FaGears",
    label: "Production",
    path: "/dashboard/production",
    allowedRoles: ["admin", "scheduler", "reception"],
  },
  {
    iconName: "FaShoppingBag",
    label: "Purchasing",
    path: "/dashboard/purchasing",
    allowedRoles: ["admin", "scheduler", "installation", "plant"],
  },

  {
    iconName: "FaShippingFast",
    label: "Installation",
    allowedRoles: ["admin", "installation", "service", "reception"],
    links: [
      {
        iconName: "GrSchedules",
        label: "Schedule",
        path: "/dashboard/installation",
      },
      {
        iconName: "FaClipboardCheck",
        label: "Site Visits",
        path: "/dashboard/installation/site-visits",
      },
      {
        iconName: "FaClipboardList",
        label: "Site Changes",
        path: "/dashboard/installation/site-changes",
      },
      {
        iconName: "FaWarehouse",
        label: "Warehouse",
        path: "/dashboard/installation/warehouse",
      },
    ],
  },
  {
    iconName: "FaTools",
    label: "Service Orders",
    path: "/dashboard/serviceorders",
    allowedRoles: ["admin", "installation", "service"],
  },
  {
    iconName: "MdFeedback",
    label: "Backorders",
    path: "/dashboard/backorders",
    allowedRoles: ["admin", "scheduler", "service", "installation", "plant"],
  },
  {
    iconName: "FaClipboardCheck",
    label: "Inspections",
    path: "/dashboard/inspections",
    allowedRoles: ["admin", "installation", "inspection"],
  },
  {
    iconName: "MdFactory",
    label: "Plant",
    allowedRoles: ["admin", "plant"],
    links: [
      {
        iconName: "FaCalendarAlt",
        label: "Wrap Schedule",
        path: "/dashboard/plant/wrap",
      },
      {
        iconName: "FaCalendarAlt",
        label: "Ship Schedule",
        path: "/dashboard/plant/ship",
      },
      {
        iconName: "FaCalendarAlt",
        label: "Service Orders",
        path: "/dashboard/plant/service-orders",
      },
    ],
  },

  {
    iconName: "FaFileInvoice",
    label: "Invoices",
    path: "/dashboard/invoices",
    allowedRoles: ["admin", "reception"],
  },
  {
    iconName: "FaClipboardCheck",
    label: "Reports",
    links: [
      {
        iconName: "FaTruckLoading",
        label: "Past Shipping",
        path: "/dashboard/reports/pastshipreport",
      },
      {
        iconName: "FaBoxOpen",
        label: "Box Count",
        path: "/dashboard/reports/boxcountreport",
      },
      {
        iconName: "FaFileInvoice",
        label: "Not Invoiced",
        path: "/dashboard/reports/shippednotinvoiced",
      },
      {
        iconName: "FaFileInvoice",
        label: "Job Status",
        path: "/dashboard/reports/jobstatusreport",
      },
      {
        iconName: "FaCalendarAlt",
        label: "Wrap Schedule",
        path: "/dashboard/reports/wrapschedulereport",
      },
      {
        iconName: "FaShippingFast",
        label: "Ship Schedule",
        path: "/dashboard/reports/shipschedulereport",
      },
    ],
  },

  {
    iconName: "FaUsers",
    label: "Clients",
    path: "/dashboard/clients",
    allowedRoles: ["designer", "admin", "manager"],
  },
  {
    iconName: "GoTools",
    label: "Installers",
    path: "/dashboard/installers",
    allowedRoles: ["admin", "installation", "service"],
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const showSidebar = pathname.startsWith("/dashboard");
  return (
    <ClerkProvider>
      <html lang="en" {...mantineHtmlProps}>
        <head></head>

        <body className={`${Quicksand.className} `}>
          <ClerkTokenProvider>
            <SupabaseProvider>
              <QueryProvider>
                <MantineProvider>
                  <Notifications />
                  <NavigationGuardProvider>
                    <div
                      style={{
                        display: "flex",
                        minHeight: "100vh",
                      }}
                    >
                      {showSidebar && (
                        <Sidebar
                          links={dashboardLinks}
                          autoCollapsePatterns={[
                            "/dashboard/installation",
                            "/dashboard/production",
                            "/dashboard/sales/newsale",
                            "/dashboard/plant/wrap",
                            "/dashboard/plant/ship",
                            "/dashboard/plant/service-orders",
                            "/dashboard/clients",
                          ]}
                        />
                      )}
                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <div style={{ flex: 1, position: "relative" }}>
                          {children}
                        </div>
                      </div>
                    </div>
                  </NavigationGuardProvider>
                </MantineProvider>
              </QueryProvider>
            </SupabaseProvider>
          </ClerkTokenProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
