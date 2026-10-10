import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RootLayout from "@/app/layout";
import HomePage from "@/app/(app)/page";

describe("SeasonDesign app shell", () => {
  it("declares a Hebrew RTL root layout", () => {
    const element = RootLayout({ children: <div>child</div> });
    expect(element.props.lang).toBe("he");
    expect(element.props.dir).toBe("rtl");
  });

  it("renders the product and standalone primary navigation", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1, name: "SeasonDesign" })).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "ניווט ראשי" });
    expect(nav).toHaveTextContent("קבוצות");
    expect(nav).toHaveTextContent("צור אימון");
    expect(nav).toHaveTextContent("תוכניות");
    expect(nav).toHaveTextContent("מאגר");
  });

  it("ships an installable standalone manifest", () => {
    const manifest = JSON.parse(readFileSync(resolve(process.cwd(), "public/manifest.webmanifest"), "utf8"));
    expect(manifest.name).toBe("SeasonDesign");
    expect(manifest.display).toBe("standalone");
    expect(manifest.dir).toBe("rtl");
  });
});
