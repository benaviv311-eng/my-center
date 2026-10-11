import { expect, test } from "@playwright/test";

test("shows private Google sign-in and explicit uninvited feedback", async ({ page }) => {
  await page.goto("/login?error=not-invited");

  await expect(page.getByRole("heading", { name: "SeasonDesign" })).toBeVisible();
  await expect(page.getByRole("button", { name: "התחברות עם Google" })).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("עדיין לא הוזמן");
});

test("offline fallback explains read-only cached behavior", async ({ page }) => {
  await page.goto("/offline");

  await expect(page.getByRole("heading", { name: "SeasonDesign במצב לא מקוון" })).toBeVisible();
  await expect(page.getByText("יצירה ושמירה של מידע חדש יחזרו כשיהיה חיבור.")).toBeVisible();
  await expect(page.getByText("אין במכשיר כרגע פרטי קבוצה שניתן להציג בבטחה.")).toBeVisible();
});
