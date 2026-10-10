import Link from "next/link";

const primaryLinks = [
  { href: "/groups", label: "קבוצות" },
  { href: "/practices/new", label: "צור אימון" },
  { href: "/programs", label: "תוכניות" },
  { href: "/library", label: "מאגר" },
];

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero" aria-labelledby="season-design-title">
        <p className="eyebrow">תכנון עונה חכם למאמן</p>
        <h1 id="season-design-title">SeasonDesign</h1>
        <p className="heroCopy">
          בונים אימון, עוקבים אחרי התקדמות הקבוצה ומתאימים את התוכנית למה שקורה במגרש.
        </p>
      </section>

      <nav className="quickGrid" aria-label="ניווט ראשי">
        {primaryLinks.map((item) => (
          <Link className="quickCard" href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>

      <section className="panel" aria-label="מצב התוכנית">
        <h2>הבסיס מוכן</h2>
        <p>בשלב הבא נחבר קבוצות, היסטוריה, מאגר תרגילים ומחולל אימונים.</p>
      </section>
    </main>
  );
}
