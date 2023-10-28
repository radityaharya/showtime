/* eslint-disable */
// @ts-nocheck

import { useState, useEffect } from "react";

export function useAuthenticatedFetch() {
  const [nextAuthSessionToken, setNextAuthSessionToken] = useState("");

  useEffect(() => {
    const nextAuthSessionToken = document.cookie
      .split("; ")
      .find((row) => {
        return row.startsWith("__Secure-next-auth.session-token");
      }) as string;
    if (nextAuthSessionToken) {
      setNextAuthSessionToken(nextAuthSessionToken);
    } else {
      console.error("Session token not found");
    }
  }, []);

  async function authenticatedFetch(
    input: RequestInfo,
    init?: RequestInit,
  ): Promise<Response> {
    if (!nextAuthSessionToken) {
      throw new Error("Session token not found");
    }

    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${nextAuthSessionToken}`);

    const response = await fetch(input, { ...init, headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  }

  return authenticatedFetch;
}