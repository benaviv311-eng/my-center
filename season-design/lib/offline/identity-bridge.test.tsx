import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  ACTIVE_USER_STORAGE_KEY,
  OfflineIdentityBridge,
  OfflineIdentityReset,
} from "./identity-bridge";

beforeEach(() => {
  window.localStorage.clear();
});

describe("offline identity bridge", () => {
  it("stores the authenticated coach namespace", async () => {
    render(<OfflineIdentityBridge userId="coach-a" />);
    await waitFor(() => {
      expect(window.localStorage.getItem(ACTIVE_USER_STORAGE_KEY)).toBe("coach-a");
    });
  });

  it("clears the previous coach namespace on the unauthenticated login screen", async () => {
    window.localStorage.setItem(ACTIVE_USER_STORAGE_KEY, "coach-a");
    render(<OfflineIdentityReset />);
    await waitFor(() => {
      expect(window.localStorage.getItem(ACTIVE_USER_STORAGE_KEY)).toBeNull();
    });
  });
});
