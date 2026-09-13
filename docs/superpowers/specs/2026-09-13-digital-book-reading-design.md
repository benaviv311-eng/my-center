# Digital Book Reading Experience Design

## Goal
Transform each standalone book page from a card-first interface into a dense, professional digital-reading experience that feels like reading a book, while preserving optional deeper expansions and the existing infinite discovery feed.

## Approved experience

### 1. Reading-first page
When a user opens a book, the primary experience is already open and readable. The user should not need to expand every card to understand the book.

Each book page begins with a professional hero area containing the book title, category, concise introduction, and later a unique visual identity. The reading body follows immediately.

### 2. Continuous chapters
The main body is presented as a continuous sequence of readable sections or chapters. Each section is open by default and contains substantial content, approximately 300–500 words when enough source material is available.

The page should visually feel like a digital book rather than a dashboard: narrower reading measure, clear typography, chapter hierarchy, generous spacing, and fewer boxed cards in the primary reading flow.

### 3. Table of contents and navigation
A visible table of contents allows jumping directly to sections. On wider screens it may remain sticky; on smaller screens it can collapse into a compact chapter navigator.

The user should always understand where they are in the book and be able to move between sections without returning to the library.

### 4. Optional deep expansion
Every substantial section includes an optional “העמק” action. Expanding it keeps the user on the same page and reveals a deeper mini-chapter, usually 700–1,200 words when content permits.

A deep expansion may include:
- a fuller explanation of the idea
- context within the book
- professional concepts or theory connected to it
- examples from real life, coaching, sport, learning, psychology, or another relevant domain
- practical application
- limitations, criticism, or an alternate point of view
- connections to other concepts or books
- reflection questions
- a concise takeaway summary

For copyrighted commercial books, deep material must be explanatory and paraphrased rather than long copied passages.

### 5. Source provenance
Existing source markers remain visible. Source labels such as “מתוך חומר הספר”, “מושג מקצועי קשור”, “הרחבה מקצועית”, and ChatGPT-generated connections remain clearly distinguished.

Clicking a source label should still explain provenance, but provenance expansion is secondary to the main reading experience.

### 6. Supporting learning blocks
Within the reading flow, special blocks may appear for:
- מושג מקצועי
- מחקר / תיאוריה קשורה
- דוגמה מהחיים
- יישום מעשי
- ביקורת / נקודת מבט אחרת
- שאלה למחשבה
- כשל לוגי when relevant

These blocks should enrich the chapter without turning the page back into a grid of closed cards.

### 7. Infinite feed placement
The existing infinite feed remains available, but moves conceptually below the core book body as an “עוד מהספר” discovery area. It is supplemental rather than the main way to learn the book.

### 8. End-of-book synthesis
Near the end of the primary reading body, show a “מה לקחת מהספר” synthesis with key takeaways. Saved items and further exploration can follow.

### 9. Visual direction
Use a professional Editorial Premium direction across the library. Structure and typography remain consistent across books, while each book can later receive a unique color system, hero image, motif, and visual identity.

No images are generated as part of this feature unless the user explicitly writes “צור”.

## Behavioral requirements
- Core chapter text is open by default.
- Deep expansions are optional and inline.
- The user should understand the book without opening expansions.
- Existing notes, saved feed items, refresh actions, and infinite feed behavior should remain available unless they conflict with the new reading hierarchy.
- The layout must work on desktop and mobile.
- Existing source/provenance behavior must continue to work.
- Content should remain dynamically generated from each book's existing content bank rather than requiring a separate hard-coded page per book.

## Success criteria
1. Opening any supported book immediately shows a substantial continuous reading experience.
2. A table of contents jumps to visible reading sections.
3. Each main section can optionally reveal a deeper inline expansion.
4. The infinite feed is visibly secondary and follows the reading body.
5. The experience works for all books that use the shared `book.html` / `book-page.js` flow.
6. Existing source badges continue to explain provenance.
7. No image generation occurs during implementation.
