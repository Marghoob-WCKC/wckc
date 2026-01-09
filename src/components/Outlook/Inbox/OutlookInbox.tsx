import { Box, Button, Center, Group, Paper, Text, Stack } from "@mantine/core";
import { useState } from "react";
import { InboxSidebar } from "./InboxSidebar";
import { InboxDetail } from "./InboxDetail";
import { useOutlook, OutlookEmail } from "./useOutlook";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { FaMicrosoft } from "react-icons/fa";

export function OutlookInbox({ defaultJobId }: { defaultJobId?: number }) {
  const { emails, loading, page, loadPage, hasMore, setSearchQuery } =
    useOutlook();

  const [selectedEmail, setSelectedEmail] = useState<OutlookEmail | null>(null);
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const activeAccount = instance.getActiveAccount();
  const handleLogin = () => {
    instance
      .loginPopup({
        scopes: ["Mail.Read", "User.Read"],
        prompt: "select_account",
      })
      .catch(console.error);
  };
  const handleLogout = () => {
    instance.logoutPopup().catch(console.error);
  };

  if (!isAuthenticated) {
    return (
      <Center h="100%" style={{ minHeight: 400 }}>
        <Paper p="xl" withBorder shadow="sm" radius="md" ta="center">
          <Text fw={700} size="lg" mb="md">
            Outlook Integration
          </Text>
          <Text c="dimmed" size="sm" mb="xl">
            Please sign in to access your inbox and attach emails to jobs.
          </Text>
          <Button leftSection={<FaMicrosoft />} onClick={handleLogin} size="md">
            Sign in with Outlook
          </Button>
        </Paper>
      </Center>
    );
  }

  return (
    <Stack h="100vh" gap="xs">
      <Group justify="space-between" align="center" px="xs" pt="xs">
        <Text fw={700} size="lg" c="dimmed">
          Outlook Integration
        </Text>
        <Group>
          <Group gap="xs">
            <Text size="sm" fw={500}>
              {activeAccount?.name}
            </Text>
            <Text size="xs" c="dimmed">
              ({activeAccount?.username})
            </Text>
          </Group>
          <Button variant="subtle" size="xs" color="red" onClick={handleLogout}>
            Sign Out
          </Button>
        </Group>
      </Group>

      <Paper
        withBorder
        shadow="sm"
        radius="md"
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
        }}
      >
        <InboxSidebar
          emails={emails}
          loading={loading}
          selectedEmailId={selectedEmail?.id || null}
          onSelect={setSelectedEmail}
          page={page}
          onPageChange={loadPage}
          onSearch={setSearchQuery}
          hasMore={hasMore}
        />
        <Box style={{ flex: 1, backgroundColor: "var(--mantine-color-white)" }}>
          {selectedEmail ? (
            <InboxDetail
              key={selectedEmail.id}
              email={selectedEmail}
              defaultJobId={defaultJobId}
            />
          ) : (
            <Center h="100%">
              <Box ta="center">
                <Text c="dimmed" size="lg">
                  Select an email to view details
                </Text>
              </Box>
            </Center>
          )}
        </Box>
      </Paper>
    </Stack>
  );
}
