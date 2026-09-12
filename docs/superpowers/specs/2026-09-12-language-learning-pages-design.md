# Language Learning Pages Design

## Goal
Turn the existing Languages area into four clear page types: a language dashboard, a focused long interactive study page for one selected language, a topics page, and a separate archive/review page.

## Locked UX
- Languages: Arabic, Italian, Russian, Spanish.
- Selecting a language opens a focused page where only that language is studied.
- The study page is intentionally long and scroll-based.
- Each exercise block has its own refresh action where useful.
- Arabic primary display uses Hebrew transliteration; Arabic script is secondary.
- Russian primary display uses Latin transliteration; Cyrillic is secondary.
- Italian and Spanish use their normal spelling as the primary display.
- Topics are separate from the exercise-page structure.
- Existing local progress stored under `my-center-languages-v1` must remain readable.

## Pages
1. `languages.html`: overview of the four languages, daily completion, progress, and links to study/topics/archive.
2. `language-study.html?lang=<code>&topic=<topic>`: focused long interactive lesson.
3. `language-topics.html?lang=<code>`: topic selection.
4. `language-archive.html?lang=<code>`: saved vocabulary, statuses, mistakes, and review.

## Interactive study flow
The long study page contains, in order:
1. Five vocabulary cards.
2. Recognition questions.
3. Reverse questions (Hebrew to target language display).
4. Sentence building from shuffled word tokens.
5. Missing-word questions.
6. True/false meaning checks.
7. Situation-based sentence choice.
8. Short translation input.
9. Small interactive dialogue.
10. “What would you say?” sentence construction.
11. Mixed review from previously seen material.
12. Mistakes-only review.
13. Final mixed challenge.
14. A button to append another batch of exercises below.

## Data and persistence
Shared language content and display helpers live in `language-core.js`. Study progress reuses `my-center-languages-v1` and adds topic choice, mistakes, and study stats without deleting old fields. Refreshing a block changes that block only.

## Initial topic set
Ship complete content for: Basics, Family, Food, Directions, Time, and Sport. The topics page can be extended later without changing the study-page architecture.
