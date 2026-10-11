"use client";

import { useEffect } from "react";

export const ACTIVE_USER_STORAGE_KEY = "season-design:active-user-id";

export function OfflineIdentityBridge({ userId }: { userId: string }) {
  useEffect(() => {
    window.localStorage.setItem(ACTIVE_USER_STORAGE_KEY, userId);
  }, [userId]);

  return null;
}

export function OfflineIdentityReset() {
  useEffect(() => {
    window.localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
  }, []);

  return null;
}
