"use client";

import { ReactNode, useEffect, useState } from "react";
import {
  PublicClientApplication,
  EventType,
  AuthenticationResult,
} from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";

export const msalConfig = {
  auth: {
    clientId: "3ea61d91-6068-4812-aadf-d4735e9992e0",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: "https://wckc.vercel.app/",
  },
  cache: {
    cacheLocation: "sessionStorage",
  },
};

const msalInstance = new PublicClientApplication(msalConfig);

const accounts = msalInstance.getAllAccounts();
if (accounts.length > 0) {
  msalInstance.setActiveAccount(accounts[0]);
}

msalInstance.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
    const payload = event.payload as AuthenticationResult;
    msalInstance.setActiveAccount(payload.account);
  }
});

export default function OutlookAuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setIsInitialized(true);
  }, []);

  if (!isInitialized) return null;

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}
