# Raika Writers Room — Infinite Creative Feed Design

## Status
Approved product direction. This spec extends the existing Raika Writers Room design; it does not replace the existing draft/version/canon/saved-item workflows.

## Goal
Turn the Raika Writers Room into an always-fresh creative partner: an infinite interactive feed that uses the entire Raika workspace as context, then proposes new story possibilities beyond what the user has already written.

The feed is for brainstorming, discovery and development — not only retrieval or remixing.

## Core creative rule
The feed may use:
- approved canon
- developing material
- drafts
- saved ideas
- characters
- relationships
- scenes
- plotlines
- history
- worldbuilding
- prior AI ideas and conversations

The feed is also explicitly allowed to invent new material that does not yet exist, including:
- new scenes
- new characters
- new relationships
- new backstory
- new secrets
- new conflicts
- new locations
- new customs or beliefs
- new antagonist motives
- new plotlines or saga directions
- new thematic or emotional connections

No generated idea becomes canon automatically. Everything created by the feed starts as a proposal.

## Product placement
The Writers Room keeps the existing `✨ צור איתי רעיון` generator.

Directly below it, add a new section:

`♾️ פיד יצירתי`

The feed appears before the existing manually saved/proposal cards so the Writers Room feels active immediately on entry.

## Feed behavior
The feed has no hard end.

- Initial load returns a mixed batch of creative cards.
- Scrolling near the bottom requests the next batch automatically.
- A manual `✨ תפתיע אותי` action can refresh part of the feed immediately.
- Already-seen cards should not be repeated unless the user explicitly asks for `עוד כזה`.
- Generation should happen in small batches rather than one card at a time to keep scrolling fluid and API use efficient.
- Recommended initial batch size: 8–12 cards.
- Recommended follow-up batch size: 6–10 cards.

## Three creative distances
The feed mixes three internal creativity levels automatically. The user does not need to choose a mode every time.

### 1. Close to current material
Ideas that naturally extend what already exists.
Examples:
- a missing beat between two scenes
- a consequence of a recent event
- a conversation two connected characters have not yet had
- an unresolved emotion that deserves a scene

### 2. Natural development
Ideas that add meaningful new material while still feeling strongly grounded in the existing world.
Examples:
- a new secret for an existing character
- a new rivalry or friendship
- a previously unseen part of a character's history
- a new subplot that grows from an existing theme

### 3. Wild card
Ideas that deliberately test the edges of the story.
Examples:
- a new character
- a new faction or location
- an unexpected relationship
- a surprising reinterpretation of an old event
- a new saga direction

Wild-card ideas remain clearly proposals internally and never override canon.

## Card families
The system should vary card type aggressively so the feed does not feel like repeated scene prompts.

Supported families include:
- `🎬 סצנה אפשרית`
- `💬 שורת דיאלוג`
- `🔗 חיבור בין דמויות`
- `🧠 סתירה פנימית`
- `❤️ רגע רגשי`
- `😂 רגע קומי`
- `⚔️ קונפליקט`
- `❓ מה אם?`
- `🕳️ חור ששווה לחקור`
- `🌱 זרע לעלילה`
- `🧭 קו עלילה חדש`
- `👤 דמות חדשה`
- `🕰️ עבר אפשרי`
- `🤫 סוד / גילוי`
- `🌍 עולם / תרבות / אמונה`
- `🦹 יריב / אנטגוניסט`
- `🧬 מורשת`
- `🏫 חיי יום-יום / בית ספר`
- `🥋 אימון / שיעור`
- `🛤️ מסע`
- `🪞 נקודת מבט אחרת`
- `➡️ מה קורה אחר כך?`
- `⬅️ מה היה רגע לפני?`
- `🌩️ רעיון פרוע`

The AI may add additional card families when useful, but they should map to the same interaction model.

## Card structure
Each card contains:
- short type label
- strong title or hook
- concise idea body
- optional character chips
- optional suggested story placement
- optional `why this may work` note
- hidden/internal provenance and context ids
- creativity-distance metadata

The visible card should prioritize the idea, not metadata.

The system stores source/provenance internally for deduplication, context reconstruction and future regeneration, but does not force source badges onto every visible card.

## Card actions
Every feed card supports:
- `💾 שמור` — save it to the Raika saved-items collection
- `❤️ אהבתי` — positive preference signal without necessarily saving
- `🔄 עוד כזה` — generate related variations while preserving the current card
- `💬 בוא נדבר על זה` — open AI consultation with this card as the starting context
- `✍️ פתח לפיתוח` — create a developing Writers Room item from the idea
- `🎬 הפוך להצעת סצנה` — expand the concept into a structured scene proposal
- `🚫 פחות כאלה` — reduce similar cards in future batches
- optional `🗑️ הסתר` — remove this individual card from the current feed

No action except explicit canon approval elsewhere can create canon.

## Preference learning
The feed should adapt to interaction signals, but not become narrow too quickly.

Positive signals:
- Like
- Save
- More like this
- Open discussion
- Open for development
- Convert to scene

Negative signals:
- Less like this
- Hide
- repeated skipping of a card family may be treated as a weak negative signal only after enough observations

The preference model should influence future batch composition rather than hard-filtering entire categories.

Recommended weighting behavior:
- `עוד כזה`, `פתח לפיתוח`, and `הפוך להצעת סצנה` are strong positive signals
- `שמור` and `אהבתי` are medium positive signals
- `פחות כאלה` is a strong negative signal for that pattern/category
- simple scrolling past a card is weak or neutral

The feed should always reserve some exploration quota so new kinds of ideas continue to appear.

## Context assembly
Before generating a batch, the backend builds a compact Raika context snapshot.

The snapshot should include a relevant selection of:
- current canon
- active developing items
- saved ideas
- recent drafts
- character summaries and relationships
- active plotlines
- recent or nearby scenes
- important world/history facts
- recently liked or disliked feed patterns
- recent generated-card signatures to avoid repetition

The full database should not be dumped into every prompt. Context should be selected and compressed to stay efficient.

## Relevance strategy
Each generated batch should deliberately mix:
- currently active material
- underused characters or plotlines
- recently saved/developed ideas
- one or more unexpected cross-connections
- at least one fresh invention when creativity level allows

This prevents the feed from repeatedly focusing only on Raika or only on the most recently edited scene.

## Deduplication
The feed must actively avoid repetition.

Each generated card stores a compact signature built from:
- card family
- main characters/entities
- central premise/theme
- referenced source items

Before showing a batch:
- reject exact duplicate signatures
- reject very similar recent cards
- reject ideas that substantially recreate an existing canon/developing scene
- allow a related variation only when triggered by `עוד כזה`

## Persistence model
Use Supabase as the feed workspace.

Recommended new tables:

### `raika_feed_cards`
Stores generated cards and their lifecycle.
Suggested fields:
- id
- user_id
- card_type
- title
- body
- structured_payload jsonb
- context_refs jsonb
- creativity_distance
- signature
- batch_id
- created_at
- hidden_at nullable
- promoted_item_id nullable

### `raika_feed_feedback`
Stores interactions with cards.
Suggested fields:
- id
- user_id
- card_id
- action
- metadata jsonb
- created_at

Do not duplicate saved/developing/canon content into these tables as authoritative story data. When the user saves or promotes a card, create/update the normal Writers Room item and keep only a reference from the feed card.

## Batch generation API
Add a server-side feed endpoint/function, separate from the existing single-prompt consultation endpoint.

Suggested operation:
`generate_feed_batch`

Input:
- desired count
- optional seed card id for `עוד כזה`
- recent visible card ids/signatures
- preference summary

Output:
- array of structured feed cards

All AI calls remain server-side. No OpenAI credential is exposed in the browser.

## AI output contract
The model must return structured JSON matching a validated schema for every card.

Required per-card fields:
- type
- title
- body
- creativity_distance
- characters/entities when relevant
- suggested placement when relevant
- why_it_may_work when relevant
- source/context references when used
- tags

Malformed cards are discarded rather than shown.

## Interactive refresh
`✨ תפתיע אותי` should not wipe saved/developing items.

It only replaces or prepends a fresh set of unsaved feed cards.

`🔄 עוד כזה` keeps the original card visible and inserts new related cards immediately below it.

## AI availability and fallback
The feed must not make the Writers Room unusable when OpenAI is unavailable.

If AI generation fails:
- keep previously generated feed cards visible
- keep manual Writers Room tools available
- keep saved/developing items available
- show a clear inline error/retry state for new generation
- optionally produce lightweight local connection prompts from existing Raika data, clearly treated as fallback prompts rather than deep AI-generated proposals

The feed must never silently fail.

## Relationship to the existing generator
The existing manual generator remains useful for directed work.

Use cases:
- Infinite Feed = discovery and brainstorming without needing to formulate a prompt
- `✨ צור איתי רעיון` = deliberate request with selected characters/mode
- `💬 התייעצות` = deeper discussion of one selected idea

These three flows should share the same underlying context and saved-item semantics.

## Relationship to Saved Items
`💾 שמור` on a feed card creates a normal saved Raika item using the existing `saved=true` workflow.

The item then appears on `📌 שמורים`.

Removing a feed card from the current feed does not delete a saved item that was already created from it.

## Relationship to Developing Items
`✍️ פתח לפיתוח` promotes the idea into a normal Writers Room item with `developing` status.

After promotion:
- the feed card remains as historical provenance
- the developing item becomes the editable authoritative version
- later edits happen in the standard Writers Room workflow

## Relationship to Canon
The feed has no direct `make canon` shortcut.

A feed idea must first become a saved/developing proposal, then use the normal explicit approval flow.

This preserves the existing rule: AI never changes canon by itself.

## UI layout
Inside `raika-writers-room.html`:
1. Existing private-room header and status
2. Existing directed generator `✨ צור איתי רעיון`
3. New `♾️ פיד יצירתי`
4. Existing proposal/draft list

The feed is one column, matching the locked Raika feed rule.

Recommended feed controls:
- `✨ תפתיע אותי`
- optional compact filters such as `הכול / דמויות / עלילה / סצנות / עולם` without forcing the user to choose a category
- visible loading skeleton/cards at the bottom during infinite load

## Feed rhythm
A batch should feel editorially mixed rather than random.

Example 10-card batch:
- 2 close-to-current scene/character continuations
- 2 relationship/emotional ideas
- 1 comedy or ordinary-life idea
- 1 world/history/legacy idea
- 1 conflict or antagonist idea
- 1 plotline seed
- 1 underused-character idea
- 1 wild card

This is a guide, not a fixed formula.

## Security
- Only the authorized Writers Room user can generate private feed batches or send feedback.
- Feed context may contain drafts/private ideas and therefore must never be exposed as a public endpoint response to unauthenticated users.
- AI credentials and server keys stay in Supabase secrets/server environment.
- RLS applies to feed cards and feedback rows by `user_id`.

## Error handling
- Batch generation failure: keep current feed and show retry.
- Individual malformed card: drop card, keep valid cards from the batch.
- Save/promotion failure: keep the card visible and allow retry.
- Duplicate generation: silently filter duplicate and request replacement when practical.
- Network interruption while scrolling: stop loading and expose a retry control; do not discard existing feed.

## Analytics kept intentionally small
Only store signals needed to improve the personal feed:
- card shown
- liked
- saved
- more-like-this
- less-like-this
- discussed
- developed
- converted-to-scene
- hidden

No social/public engagement system is part of this design.

## Testing
Frontend:
- initial feed mount
- infinite-scroll threshold loads next batch once
- loading guard prevents duplicate concurrent requests
- `תפתיע אותי` refreshes unsaved feed cards
- `עוד כזה` inserts variations without deleting original
- save/develop/scene actions preserve original card
- AI failure remains visible and retryable
- one-column Raika layout remains intact

Backend:
- only authorized user can generate feed
- context includes canon + developing + drafts + saved material
- generated cards are always proposals
- output schema validation rejects malformed cards
- recent signatures are used for deduplication
- feedback is scoped to current user
- more-like-this uses the selected card as seed

Persistence:
- saved feed card creates a normal saved Writers Room item
- developing promotion creates a normal developing item
- hiding a feed card does not delete promoted content
- no feed operation can directly write canon

AI behavior tests:
- batch contains multiple card families
- batch can invent new material not present in context
- invented material remains explicitly proposal-state internally
- no substantial duplicate of a developing/canon scene
- preference signals influence but do not fully collapse future variety

## Out of scope
- public/social feed
- multiple authors or collaborators
- automatic canon approval
- automatic image generation
- automatic publication to Instagram/social media
- training a custom model on Raika
- embedding every Raika record in a vector database in the first version

## Done criteria
The feature is complete when the authorized user can open the Writers Room and continuously scroll through fresh, varied Raika ideas; the system uses canon, drafts, developing and saved material as context while also inventing new story possibilities; interactions influence later batches; cards can be saved, discussed, developed or converted to scene proposals; repeated ideas are actively reduced; AI outages do not destroy the current room state; and no generated idea can become canon without the existing explicit approval flow.
