import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Text,
  Group,
  Avatar,
  Divider,
  Paper,
  Title,
  Stack,
  Button,
  Loader,
  Checkbox,
  Modal,
  Select,
  ScrollArea,
  SimpleGrid,
  ThemeIcon,
  Switch,
  Collapse,
  Container,
  ActionIcon,
  Image,
} from "@mantine/core";
import { OutlookEmail, OutlookAttachment, useOutlook } from "./useOutlook";
import dayjs from "dayjs";
import {
  FaPaperclip,
  FaDownload,
  FaCloudUploadAlt,
  FaFilePdf,
  FaFileImage,
  FaFileAlt,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { notifications } from "@mantine/notifications";
import { useJobSearch } from "@/hooks/useJobSearch";
import { useJobAttachments } from "@/hooks/useJobAttachments";
import { JobAttachmentCategoryOptions } from "@/dropdowns/dropdownOptions";

interface InboxDetailProps {
  email: OutlookEmail;
  defaultJobId?: number;
}

const cleanBodyProperties = (doc: Document) => {
  const replyDiv = doc.getElementById("divRplyFwdMsg");
  if (replyDiv) replyDiv.remove();

  const gmailQuote = doc.querySelector(".gmail_quote");
  if (gmailQuote) gmailQuote.remove();

  return doc.body.innerHTML;
};

const getFileIcon = (contentType: string) => {
  if (contentType.includes("pdf")) return <FaFilePdf color="#fa5252" />;
  if (contentType.includes("image")) return <FaFileImage color="#228be6" />;
  return <FaFileAlt color="gray" />;
};

function ThreadMessage({
  email,
  isOpen,
  onToggle,
  onAttachmentsLoaded,
  isLatest,
  onUpload,
}: {
  email: OutlookEmail;
  isOpen: boolean;
  onToggle: () => void;
  onAttachmentsLoaded: (
    id: string,
    atts: OutlookAttachment[],
    sigIds: string[]
  ) => void;
  isLatest: boolean;
  onUpload: (atts: OutlookAttachment[]) => void;
}) {
  const { fetchEmailDetails } = useOutlook({ manualFetch: true });
  const [processedBody, setProcessedBody] = useState<string>("");
  const [attachments, setAttachments] = useState<OutlookAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (hasLoaded) return;

      setLoading(true);
      try {
        const details = await fetchEmailDetails(email.id);
        if (mounted && details) {
          const atts = details.attachments || [];
          setAttachments(atts);
          let bodyContent = details.body?.content || email.bodyPreview || "";
          const inlineAttachments = atts.filter(
            (a) => a.isInline && a.contentBytes
          );

          const foundSigs: string[] = [];

          try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(bodyContent, "text/html");

            bodyContent = cleanBodyProperties(doc);

            if (inlineAttachments.length > 0) {
              inlineAttachments.forEach((att) => {
                const srcData = `data:${att.contentType};base64,${att.contentBytes}`;
                const escapeRegExp = (string: string) =>
                  string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

                if (att.contentId) {
                  const regexCid = new RegExp(
                    `cid:${escapeRegExp(att.contentId)}`,
                    "gi"
                  );
                  bodyContent = bodyContent.replace(regexCid, srcData);
                }
                if (att.name) {
                  const regexName = new RegExp(
                    `cid:${escapeRegExp(att.name)}`,
                    "gi"
                  );
                  bodyContent = bodyContent.replace(regexName, srcData);
                }
              });
            }
          } catch (e) {
            console.error("Error parsing email body:", e);
          }

          onAttachmentsLoaded(email.id, atts, []);
          setProcessedBody(bodyContent);
          setHasLoaded(true);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [email.id, hasLoaded]);

  const displayedAttachments = attachments;
  const handleDownloadAll = () => {
    displayedAttachments.forEach((att) => {
      const link = document.createElement("a");
      link.href = `data:${att.contentType};base64,${att.contentBytes}`;
      link.download = att.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
    notifications.show({
      title: "Downloading...",
      message: `${displayedAttachments.length} files`,
      color: "blue",
    });
  };

  return (
    <Paper
      withBorder
      radius="md"
      mb="sm"
      style={{
        overflow: "hidden",
        borderColor: isOpen ? "var(--mantine-color-violet-3)" : undefined,
      }}
    >
      {}
      <Box
        p="sm"
        onClick={onToggle}
        bg={isOpen ? "white" : "gray.0"}
        style={{ cursor: "pointer", transition: "background 0.2s" }}
      >
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <Avatar
              size="md"
              radius="xl"
              variant="gradient"
              gradient={{ from: "#8E2DE2", to: "#4A00E0", deg: 45 }}
            >
              {email.from?.emailAddress?.name?.charAt(0) || "?"}
            </Avatar>
            <Stack gap={0}>
              <Text size="sm" fw={700}>
                {email.from?.emailAddress?.name}
              </Text>
              <Text size="xs" c="dimmed">
                {dayjs(email.receivedDateTime).format("MMM D, h:mm A")}
              </Text>
            </Stack>
          </Group>
          <Group>
            {!isOpen && (
              <Text
                size="sm"
                c="dimmed"
                lineClamp={1}
                style={{ maxWidth: 300 }}
              >
                {email.bodyPreview}
              </Text>
            )}
            {}
            {!isOpen && attachments.length > 0 && (
              <FaPaperclip size={12} color="gray" />
            )}
            <ActionIcon variant="transparent" color="gray">
              {isOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
            </ActionIcon>
          </Group>
        </Group>
      </Box>

      {}
      <Collapse in={isOpen}>
        <Box p="md" pt={0}>
          <Divider mb="md" variant="dashed" />
          <style>{`
            .email-body-content img {
              max-width: 100% !important;
              height: auto !important;
            }
          `}</style>
          {loading && !hasLoaded ? (
            <Group justify="center" py="xl">
              <Loader size="sm" color="violet" />
            </Group>
          ) : (
            <>
              <Box
                className="email-body-content"
                dangerouslySetInnerHTML={{ __html: processedBody }}
                style={{
                  fontSize: "15px",
                  lineHeight: "1.6",
                  color: "#333",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              />
              {}
              {displayedAttachments.length > 0 && (
                <Paper mt="lg" p="sm" withBorder radius="md" bg="gray.0">
                  <Group justify="space-between" mb="xs">
                    <Group gap="xs">
                      <ThemeIcon variant="light" color="violet" size="sm">
                        <FaPaperclip size={10} />
                      </ThemeIcon>
                      <Text fw={600} size="xs">
                        Attachments ({displayedAttachments.length})
                      </Text>
                    </Group>
                    <Group gap={8}>
                      <Button
                        leftSection={<FaDownload size={12} />}
                        size="xs"
                        variant="default"
                        onClick={handleDownloadAll}
                      >
                        Download All
                      </Button>
                      <Button
                        leftSection={<FaCloudUploadAlt size={12} />}
                        size="xs"
                        variant="gradient"
                        gradient={{ from: "#8E2DE2", to: "#4A00E0", deg: 45 }}
                        onClick={() => onUpload(displayedAttachments)}
                      >
                        Upload to Job
                      </Button>
                    </Group>
                  </Group>
                  <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="xs">
                    {displayedAttachments.map((att) => {
                      const isImage = att.contentType.startsWith("image/");
                      return (
                        <Paper key={att.id} p="xs" withBorder radius="md">
                          <Group wrap="nowrap">
                            {isImage && att.contentBytes ? (
                              <Image
                                src={`data:${att.contentType};base64,${att.contentBytes}`}
                                w={30}
                                h={30}
                                radius="sm"
                                fit="cover"
                              />
                            ) : (
                              <ThemeIcon size="md" variant="light" color="gray">
                                {getFileIcon(att.contentType)}
                              </ThemeIcon>
                            )}
                            <Box style={{ overflow: "hidden" }}>
                              <Text size="xs" truncate>
                                {att.name}
                              </Text>
                              <Text size="10px" c="dimmed">
                                {(att.size / 1024).toFixed(0)} KB
                              </Text>
                            </Box>
                          </Group>
                        </Paper>
                      );
                    })}
                  </SimpleGrid>
                </Paper>
              )}
            </>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}

export function InboxDetail({ email, defaultJobId }: InboxDetailProps) {
  const { fetchConversationMessages, fetchEmailDetails } = useOutlook({
    manualFetch: true,
  });

  const [conversation, setConversation] = useState<OutlookEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [attachmentsMap, setAttachmentsMap] = useState<
    Record<string, OutlookAttachment[]>
  >({});

  const [selectedJobId, setSelectedJobId] = useState<string | null>(
    defaultJobId ? String(defaultJobId) : null
  );
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<string[]>(
    []
  );
  const [selectedCategory, setSelectedCategory] =
    useState<string>("Installation");

  const {
    options: jobOptions,
    search: jobSearch,
    setSearch: setJobSearch,
    isLoading: jobSearchLoading,
  } = useJobSearch(selectedJobId);

  const { uploadFileAsync, isUploading } = useJobAttachments(
    selectedJobId ? Number(selectedJobId) : 0
  );

  useEffect(() => {
    let mounted = true;
    const loadConversation = async () => {
      setLoading(true);
      setAttachmentsMap({});
      setOpenIds([]);

      try {
        let conversationId = email.conversationId;
        if (!conversationId) {
          const details = await fetchEmailDetails(email.id);
          if (details) conversationId = details.conversationId;
        }

        if (conversationId) {
          const msgs = await fetchConversationMessages(conversationId);
          if (mounted && msgs.length > 0) {
            setConversation(msgs);
            setOpenIds([msgs[msgs.length - 1].id]);
            return;
          }
        }
        if (mounted) {
          setConversation([email]);
          setOpenIds([email.id]);
        }
      } catch (e) {
        console.error(e);
        if (mounted) {
          setConversation([email]);
          setOpenIds([email.id]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadConversation();
    return () => {
      mounted = false;
    };
  }, [email.id, email.conversationId]);

  const allAttachments = useMemo(() => {
    return Object.values(attachmentsMap).flat();
  }, [attachmentsMap]);

  const displayedAttachments = useMemo(() => {
    let filtered = allAttachments;

    const seen = new Set();
    return filtered.filter((a) => {
      const key = `${a.name}-${a.size}-${a.contentType}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [allAttachments]);

  const toggleMessage = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleDownloadAll = () => {
    displayedAttachments.forEach((att) => {
      const link = document.createElement("a");
      link.href = `data:${att.contentType};base64,${att.contentBytes}`;
      link.download = att.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
    notifications.show({
      title: "Downloading...",
      message: `${displayedAttachments.length} files`,
      color: "blue",
    });
  };

  const handleUploadClick = () => {
    setSelectedAttachmentIds(displayedAttachments.map((a) => a.id));
    setUploadModalOpen(true);
  };

  const handleMessageUpload = (atts: OutlookAttachment[]) => {
    setSelectedAttachmentIds(atts.map((a) => a.id));
    setUploadModalOpen(true);
  };

  const confirmUpload = async () => {
    if (!selectedJobId) return;
    const filesToUpload = allAttachments.filter((a) =>
      selectedAttachmentIds.includes(a.id)
    );

    try {
      for (const att of filesToUpload) {
        const byteCharacters = atob(att.contentBytes);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const file = new File([byteArray], att.name, { type: att.contentType });

        await uploadFileAsync({
          file,
          category: selectedCategory,
          silent: true,
        });
      }
      notifications.show({
        title: "Success",
        message: "uploaded",
        color: "green",
      });
      setUploadModalOpen(false);
    } catch (e: any) {
      notifications.show({ title: "Error", message: e.message, color: "red" });
    }
  };

  if (loading) {
    return (
      <Stack align="center" mt={50}>
        <Loader type="dots" />
      </Stack>
    );
  }

  return (
    <Box h="100%" display="flex" style={{ flexDirection: "column" }}>
      <ScrollArea flex={1} bg="gray.1">
        <Container fluid p="sm">
          <Title order={4} mb="md" style={{ color: "#333" }}>
            {email.subject}
          </Title>
          <Stack gap="xs">
            {conversation.map((msg, index) => (
              <ThreadMessage
                key={msg.id}
                email={msg}
                isOpen={openIds.includes(msg.id)}
                onToggle={() => toggleMessage(msg.id)}
                onAttachmentsLoaded={(id, atts, sigIds) => {
                  setAttachmentsMap((prev) => ({ ...prev, [id]: atts }));
                }}
                isLatest={index === conversation.length - 1}
                onUpload={handleMessageUpload}
              />
            ))}
          </Stack>
        </Container>
      </ScrollArea>

      {}
      <Modal
        opened={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload to Job"
        centered
        size="lg"
      >
        <Stack>
          <Select
            label="Select Job"
            data={jobOptions}
            searchable
            searchValue={jobSearch}
            onSearchChange={setJobSearch}
            value={selectedJobId}
            onChange={setSelectedJobId}
          />
          <Select
            label="Category"
            data={JobAttachmentCategoryOptions}
            value={selectedCategory}
            onChange={(v) => setSelectedCategory(v || "Installation")}
          />

          <Text size="sm" fw={500} mt="sm">
            Selected Files:
          </Text>
          <ScrollArea.Autosize mah={300} type="always">
            <SimpleGrid cols={2} spacing="xs">
              {displayedAttachments.map((att) => {
                const isImage = att.contentType.startsWith("image/");
                const isSelected = selectedAttachmentIds.includes(att.id);
                return (
                  <Paper
                    key={att.id + "modal"}
                    p="xs"
                    withBorder
                    radius="md"
                    bg={isSelected ? "var(--mantine-color-blue-0)" : undefined}
                    style={{
                      cursor: "pointer",
                      borderColor: isSelected
                        ? "var(--mantine-color-blue-5)"
                        : undefined,
                    }}
                    onClick={() => {
                      if (isSelected)
                        setSelectedAttachmentIds((p) =>
                          p.filter((x) => x !== att.id)
                        );
                      else setSelectedAttachmentIds((p) => [...p, att.id]);
                    }}
                  >
                    <Group wrap="nowrap">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => {}}
                        style={{ pointerEvents: "none" }}
                      />
                      {isImage && att.contentBytes ? (
                        <Image
                          src={`data:${att.contentType};base64,${att.contentBytes}`}
                          w={40}
                          h={40}
                          radius="sm"
                          fit="cover"
                        />
                      ) : (
                        <ThemeIcon size="lg" variant="light" color="gray">
                          {getFileIcon(att.contentType)}
                        </ThemeIcon>
                      )}
                      <Box style={{ overflow: "hidden" }}>
                        <Text size="xs" truncate>
                          {att.name}
                        </Text>
                        <Text size="10px" c="dimmed">
                          {(att.size / 1024).toFixed(0)} KB
                        </Text>
                      </Box>
                    </Group>
                  </Paper>
                );
              })}
            </SimpleGrid>
          </ScrollArea.Autosize>

          <Button
            fullWidth
            onClick={confirmUpload}
            loading={isUploading}
            variant="gradient"
            gradient={{ from: "#8E2DE2", to: "#4A00E0", deg: 45 }}
            mt="md"
          >
            Upload {selectedAttachmentIds.length} Files
          </Button>
        </Stack>
      </Modal>
    </Box>
  );
}
