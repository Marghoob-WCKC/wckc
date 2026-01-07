"use client";

import React, { useState, useEffect } from "react";
import {
  PublicClientApplication,
  EventType,
  AuthenticationResult,
} from "@azure/msal-browser";
import { MsalProvider, useMsal, useIsAuthenticated } from "@azure/msal-react";
import { Client } from "@microsoft/microsoft-graph-client";
import { useSupabase } from "@/hooks/useSupabase";

const msalConfig = {
  auth: {
    clientId: "3ea61d91-6068-4812-aadf-d4735e9992e0",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: "http://localhost:3000",
  },
  cache: {
    cacheLocation: "sessionStorage",
  },
};

const msalInstance = new PublicClientApplication(msalConfig);

if (
  !msalInstance.getActiveAccount() &&
  msalInstance.getAllAccounts().length > 0
) {
  msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
}

msalInstance.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
    const payload = event.payload as AuthenticationResult;
    msalInstance.setActiveAccount(payload.account);
  }
});

export default function OutlookScannerWrapper({ jobId }: { jobId?: number }) {
  return (
    <MsalProvider instance={msalInstance}>
      <OutlookScannerContent jobId={jobId} />
    </MsalProvider>
  );
}

function OutlookScannerContent({ jobId }: { jobId?: number }) {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const { supabase } = useSupabase();

  const [emails, setEmails] = useState<any[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  const handleLogin = () => {
    instance
      .loginPopup({
        scopes: ["Mail.Read", "User.Read"],
      })
      .catch((e) => console.error(e));
  };

  const fetchEmails = async () => {
    setLoading(true);
    const request = {
      scopes: ["Mail.Read"],
      account: accounts[0],
    };

    try {
      const response = await instance.acquireTokenSilent(request);
      const graphClient = Client.init({
        authProvider: (done) => done(null, response.accessToken),
      });

      const result = await graphClient
        .api("/me/messages")
        .select("id,subject,from,receivedDateTime,hasAttachments,bodyPreview")
        .filter("hasAttachments eq true")
        .top(15)
        .get();

      setEmails(result.value);
    } catch (error) {
      console.error("Error fetching emails", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttachments = async (messageId: string) => {
    setLoading(true);
    setAttachments([]);

    const request = {
      scopes: ["Mail.Read"],
      account: accounts[0],
    };

    try {
      const response = await instance.acquireTokenSilent(request);
      const graphClient = Client.init({
        authProvider: (done) => done(null, response.accessToken),
      });

      const result = await graphClient
        .api(`/me/messages/${messageId}/attachments`)
        .get();

      const images = result.value.filter(
        (att: any) => att.contentType && att.contentType.startsWith("image/")
      );

      setAttachments(images);
      setSelectedEmail(messageId);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const uploadImageToJob = async (attachment: any) => {
    if (!jobId) {
      alert("Please select a Job ID first (pass it as a prop or select in UI)");
      return;
    }

    setUploadStatus(`Uploading ${attachment.name}...`);

    try {
      const byteCharacters = atob(attachment.contentBytes);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: attachment.contentType });

      const fileName = `outlook_${Date.now()}_${attachment.name}`;
      const filePath = `job_${jobId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("job_photos")
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("job_attachments").insert({
        job_id: jobId,
        file_name: attachment.name,
        file_path: filePath,
        file_type: attachment.contentType,
        file_size: attachment.size,
        category: "Outlook Import",
        uploaded_by: "Outlook Importer",
      });

      if (dbError) throw dbError;

      setUploadStatus("Success!");
    } catch (error) {
      console.error("Upload failed", error);
      setUploadStatus("Error uploading.");
    }
  };

  return (
    <div className="p-4 border rounded shadow bg-white">
      <h2 className="text-xl font-bold mb-4">Outlook Inbox Scanner</h2>

      {!isAuthenticated ? (
        <button
          onClick={handleLogin}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Connect Outlook
        </button>
      ) : (
        <div className="flex gap-4">
          {}
          <div className="w-1/3 border-r pr-4 h-96 overflow-y-auto">
            <button
              onClick={fetchEmails}
              className="w-full mb-2 bg-gray-100 p-2 rounded text-sm font-semibold"
            >
              🔄 Refresh Inbox
            </button>

            {loading && emails.length === 0 && <p>Loading emails...</p>}

            {emails.map((email) => (
              <div
                key={email.id}
                onClick={() => fetchAttachments(email.id)}
                className={`p-2 border-b cursor-pointer hover:bg-blue-50 text-sm ${
                  selectedEmail === email.id ? "bg-blue-100" : ""
                }`}
              >
                <div className="font-bold truncate">
                  {email.from?.emailAddress?.name}
                </div>
                <div className="truncate">{email.subject}</div>
                <div className="text-xs text-gray-500">
                  {new Date(email.receivedDateTime).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>

          {}
          <div className="w-2/3 pl-4 h-96 overflow-y-auto">
            {!selectedEmail && (
              <p className="text-gray-500">Select an email to view images</p>
            )}

            {loading && selectedEmail && <p>Scanning for inline images...</p>}

            <div className="grid grid-cols-2 gap-4">
              {attachments.map((att) => (
                <div key={att.id} className="border p-2 rounded">
                  {}
                  <img
                    src={`data:${att.contentType};base64,${att.contentBytes}`}
                    alt={att.name}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                  <div className="text-xs truncate mb-2">{att.name}</div>

                  <button
                    onClick={() => uploadImageToJob(att)}
                    disabled={!jobId}
                    className={`w-full py-1 rounded text-xs text-white ${
                      jobId ? "bg-green-600 hover:bg-green-700" : "bg-gray-300"
                    }`}
                  >
                    {jobId ? "Save to Job" : "Select Job First"}
                  </button>
                </div>
              ))}
            </div>

            {attachments.length === 0 && selectedEmail && !loading && (
              <p className="text-gray-500 italic">
                No images found in this email.
              </p>
            )}

            {uploadStatus && (
              <p className="mt-2 text-sm font-bold text-blue-600">
                {uploadStatus}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
