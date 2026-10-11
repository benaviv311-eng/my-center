import Link from "next/link";

const items = [
  { href: "/", label: "בית" },
  { href: "/groups", label: "קבוצות" },
  { href: "/practices/new", label: "צור אימון" },
  { href: "/programs", label: "תוכניות" },
  { href: "/library", label: "מאגר" },
] as const;

export function AppNav() {
  return (
    <nav className="appNav" aria-label="ניווט ראשי">
      <Link className="brandMark" href="/">SeasonDesign</Link>
      <div className="appNavLinks">
        {items.map((item) => (
          <Link key={item.href} href={item.href}>{item.label}</Link>
        ))}
      </div>
    </nav>
  );
}
