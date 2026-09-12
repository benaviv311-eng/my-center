# Raika Feed + Page Navigation Design

## Goal
Turn the frozen Raika topic navigation into real page navigation, while keeping `raika.html` as the scrollable home page for the Raika universe with a daily randomized feed.

## Approved behavior

### Frozen navigation
The persistent Raika topic bar must no longer jump to anchors inside `raika.html`.
Each topic opens its own page:
- `raika-characters.html` — 👥 דמויות
- `raika-scenes.html` — 🎬 סצנות
- `raika-plotlines.html` — 🧭 קווי עלילה
- `raika-history.html` — ⏳ עבר והיסטוריה
- `raika-world.html` — ⛩️ עולם ואמונות
- `raika-relationships.html` — 🔗 מערכות יחסים
- `raika-writers-room.html` — 💡 חדר הכותבים

The same topic bar appears on each Raika page so movement between sections is always one click.

### Raika home feed
`raika.html` remains the Raika home page and is designed for vertical scrolling.
It shows a mixed daily feed generated from existing Raika data such as:
- characters and their traits/wants/fears/beliefs/contradictions
- scenes
- plotlines
- history
- world / beliefs / traditions / symbols
- relationships
- writers-room ideas, conversations, comedy, flashbacks, thoughts, desires, heritage and worldbuilding ideas

The feed must visibly preserve each item's status (`canon`, `developing`, `idea`, `parked`) so proposals never look canonical.

### Daily stability + manual refresh
For a given calendar day, the default feed ordering is deterministic and stays the same across reloads.
A `🔄 רענן פיד` control creates a new shuffle for that same day and stores that refresh choice locally, so returning later that day keeps the manually refreshed order.
On the next day, a new default daily feed is generated automatically.

### Feed cards
Each card is short and readable: source/category, title, selected text/attribute, status, and an action to open the relevant Raika page.
The feed does not convert assistant ideas to canon and does not invent new canon.

### Existing private writers-room behavior
The private authentication, edit, version and AI consultation system remains available on the relevant content pages. Public browsing stays public; private controls only appear for the authorized session.

## Technical approach
- Keep `raika-data.js` as the canonical browser data source.
- Extract/shared rendering and navigation behavior through the existing Raika JavaScript rather than duplicating data in HTML.
- Add a small page-mode configuration to each new page so the same renderer can show the correct collection.
- Add deterministic seeded shuffle logic for the daily feed and a localStorage refresh counter/seed for manual refresh.
- Keep the existing bottom navigation unchanged.

## Testing
Automated Node tests must verify:
- frozen navigation uses page URLs rather than `#anchors`
- all seven Raika section pages exist and load the shared Raika assets
- daily feed is deterministic for the same date/seed
- refresh seed changes the feed order
- status labels remain visible
- private scripts remain wired where private actions are expected
- all touched browser scripts pass syntax checks

## Non-goals
- No redesign of the global `index.html` home feed.
- No migration of Raika data to a new backend.
- No automatic canon promotion.
- No new generated images.
