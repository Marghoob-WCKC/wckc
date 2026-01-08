import { useState, useEffect, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { Client } from "@microsoft/microsoft-graph-client";
import { notifications } from "@mantine/notifications";

export interface OutlookEmail {
  id: string;
  subject: string;
  from: { emailAddress: { name: string; address: string } };
  receivedDateTime: string;
  hasAttachments: boolean;
  bodyPreview: string;
  body?: { content: string; contentType: string };
  toRecipients: { emailAddress: { name: string; address: string } }[];
  conversationId: string;
  conversationIndex: string;
}

export interface OutlookAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  isInline: boolean;
  contentBytes: string;
  contentId?: string;
}

const detailsCache = new Map<string, Promise<any>>();

export function useOutlook(options?: { manualFetch?: boolean }) {
  const { instance, accounts } = useMsal();
  const [emails, setEmails] = useState<OutlookEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const pageSize = 25;
  const [searchQuery, setSearchQuery] = useState("");
  const [hasMore, setHasMore] = useState(true);

  const getGraphClient = useCallback(async () => {
    const request = {
      scopes: ["Mail.Read"],
      account: accounts[0],
    };

    try {
      const response = await instance.acquireTokenSilent(request);
      return Client.init({
        authProvider: (done) => done(null, response.accessToken),
      });
    } catch (e) {
      console.error("Token acquisition failed", e);
      throw e;
    }
  }, [accounts, instance]);

  const fetchEmails = useCallback(
    async (reset = false) => {
      if (accounts.length === 0) return;

      setLoading(true);
      setError(null);

      try {
        const client = await getGraphClient();
        const currentPage = reset ? 0 : page;

        let query = client
          .api("/me/mailFolders/inbox/messages")
          .select(
            "id,conversationId,conversationIndex,subject,from,receivedDateTime,hasAttachments,bodyPreview,toRecipients"
          )
          .top(pageSize)
          .skip(currentPage * pageSize);

        if (searchQuery) {
          query = client
            .api("/me/mailFolders/inbox/messages")
            .search(`"${searchQuery}"`)
            .select(
              "id,conversationId,conversationIndex,subject,from,receivedDateTime,hasAttachments,bodyPreview,toRecipients"
            )
            .top(pageSize)
            .skip(currentPage * pageSize);
        } else {
          query = query.orderby("receivedDateTime DESC");
        }

        const result = await query.get();

        if (reset) {
          setEmails(result.value);
          setPage(1);
        } else {
          setEmails(result.value);
          setPage(currentPage + 1);
        }

        if (result.value.length < pageSize) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to fetch emails");
        notifications.show({
          title: "Error",
          message: "Failed to fetch emails from Outlook",
          color: "red",
        });
      } finally {
        setLoading(false);
      }
    },
    [accounts, getGraphClient, page, searchQuery]
  );

  const [nextPageLinks, setNextPageLinks] = useState<(string | null)[]>([]);

  useEffect(() => {
    if (!options?.manualFetch && accounts.length > 0) {
      setNextPageLinks([]); 
      loadPage(0);
    }
  }, [searchQuery, accounts.length]); 

  const loadPage = async (pageIndex: number) => {
    if (accounts.length === 0) return;
    setLoading(true);
    try {
      const client = await getGraphClient();
      let result;

      if (searchQuery) {
        if (pageIndex === 0) {
          result = await client
            .api("/me/mailFolders/inbox/messages")
            .search(`"${searchQuery}"`)
            .select(
              "id,conversationId,conversationIndex,subject,from,receivedDateTime,hasAttachments,bodyPreview,toRecipients"
            )
            .top(pageSize)
            .get();
        } else {
          const cursorLink = nextPageLinks[pageIndex - 1];

          if (!cursorLink) {
            console.warn("No nextLink available for page", pageIndex);
            setLoading(false);
            return;
          }

          result = await client.api(cursorLink).get();
        }
      } else {
        const query = client
          .api("/me/mailFolders/inbox/messages")
          .select(
            "id,conversationId,conversationIndex,subject,from,receivedDateTime,hasAttachments,bodyPreview,toRecipients"
          )
          .top(pageSize)
          .skip(pageIndex * pageSize)
          .orderby("receivedDateTime DESC");

        result = await query.get();
      }

      setEmails(result.value);
      setPage(pageIndex);

      const nextLink = result["@odata.nextLink"];
      if (nextLink) {
        setHasMore(true);
        setNextPageLinks((prev) => {
          const copy = [...prev];
          copy[pageIndex] = nextLink;
          return copy;
        });
      } else {
        setHasMore(false);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailDetails = useCallback(
    async (
      messageId: string
    ): Promise<
      (OutlookEmail & { attachments?: OutlookAttachment[] }) | null
    > => {
      if (detailsCache.has(messageId)) {
        return detailsCache.get(messageId);
      }

      const requestPromise = (async () => {
        try {
          const client = await getGraphClient();
          const result = await client
            .api(`/me/messages/${messageId}`)
            .select(
              "id,conversationId,conversationIndex,subject,from,receivedDateTime,hasAttachments,body,toRecipients"
            )
            .expand("attachments")
            .get();
          return result;
        } catch (e) {
          console.error(e);
          detailsCache.delete(messageId);
          return null;
        }
      })();

      detailsCache.set(messageId, requestPromise);
      return requestPromise;
    },
    [getGraphClient]
  );

  const fetchConversationMessages = useCallback(
    async (
      conversationId: string
    ): Promise<(OutlookEmail & { attachments?: OutlookAttachment[] })[]> => {
      try {
        const client = await getGraphClient();
        const result = await client
          .api("/me/messages")
          .filter(`conversationId eq '${conversationId}'`)
          .select(
            "id,conversationId,conversationIndex,subject,from,receivedDateTime,hasAttachments,body,toRecipients"
          )
          .expand("attachments")
          .get();

        return (result.value || []).sort(
          (a: OutlookEmail, b: OutlookEmail) =>
            new Date(a.receivedDateTime).getTime() -
            new Date(b.receivedDateTime).getTime()
        );
      } catch (e) {
        console.error("Failed to fetch conversation thread", e);
        return [];
      }
    },
    [getGraphClient]
  );

  const fetchAttachments = async (
    messageId: string
  ): Promise<OutlookAttachment[]> => {
    try {
      const client = await getGraphClient();
      const result = await client
        .api(`/me/messages/${messageId}/attachments`)
        .select("id,name,contentType,size,isInline,contentBytes,contentId")
        .get();
      return result.value;
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  return {
    emails,
    loading,
    error,
    page,
    hasMore,
    searchQuery,
    setSearchQuery,
    loadPage,
    fetchEmailDetails,
    fetchConversationMessages,
    fetchAttachments,
  };
}
