# Language Living World — Approved Design

## Goal
Upgrade the existing `languages.html` experience in `my-center`, preserving the four-language infinite feed and all existing lesson/game/archive routes while making it feel like a living language-learning world.

## Product behavior
- Arabic, Italian, Russian, and Spanish remain independent learning contexts; mixed and side-by-side four-language modes remain available.
- Feed remains the main entry point, mixing words, sentences, culture, challenges, flashcards, mini-games, branching missions, and review prompts without long runs of one card type.
- A visual World area offers cafe, market, and station adventures in each language. Every mission has NPC dialogue, three answer choices, a consequence, follow-up step, and a completion state. The user may retry and switch language freely.
- A personal coach uses local answer history to identify weak areas, recommend a next mission and explain missed answers without misrepresenting this rule-based feedback as AI-generated conversation.
- Successful practice advances an adaptive per-language word/phrase memory record, with review due after increasing intervals. Mistakes become reviewable sooner. Existing `my-center-languages-v1` progress is not deleted or reinterpreted.
- Audio playback uses the site's existing speech capability. Optional speech recognition provides a transcript and gentle feedback only when the browser supports it; it never silently scores the learner or stores raw recordings.
- The interface stays Hebrew/RTL with established transliteration rules, accessible controls, responsive layouts, colorful scene imagery, and compact language-specific navigation.

## Delivery and constraints
- A static, browser-local experience in the existing public GitHub Pages repository; no new Site, no schema migrations, no credentials in source.
- First complete release: three story locations across four languages, integrated feed teasers, coach/review, improved language navigation and visual presentation. Preserve the rest of `my-center` unchanged.
- Deployment through the existing repository's publishing flow after tests and verification.
