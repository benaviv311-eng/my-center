# Raika Writers Room — Cloud, AI and Sheets Sync Design

## Status
Approved design. This spec supersedes older writers-room decisions where approved canon stayed only in Supabase.

## Goal
Turn the Raika writers room into a persistent private workspace where the authorized user can save, edit, delete drafts, approve canon, archive approved material, and generate AI-assisted story ideas.

## Data ownership
- Supabase is the primary workspace for drafts, edits, versions, approvals and AI conversations.
- Google Sheets is the approved-canon/archive ledger.
- Target workbook: `העולם שלי`.
- Target tab: `עולם ראיקה`.
- Drafts never sync to Sheets.

## Proposal card actions
Every proposal supports:
- Save
- Edit
- Retry AI generation when applicable
- Approve
- Delete
- Versions
- Consult AI

## Autosave
- Editing marks a card as dirty.
- After roughly one second without typing, the current draft is saved to Supabase.
- Manual Save flushes immediately.
- Autosave updates the active record without creating a version on every keystroke.
- A version snapshot is created on manual Save, Approve, Archive and Restore.
- Failed save never clears the editor text.

## Status model
- `idea` — proposal
- `developing` — in development
- `canon` — approved
- `parked` — set aside
- `archived` — archive

Only an explicit Approve action may move a proposal into canon.

## Delete vs archive
- Unapproved draft: Delete removes it from the active writers room.
- Approved canon: Delete means Archive. The content remains in Supabase history and the Sheets row is updated to archive instead of being removed.

## Sheets sync
Approve immediately triggers an upsert to `העולם שלי` → `עולם ראיקה`.

The existing tab layout remains intact. Columns G and H are reserved for sync metadata:
- G: stable `raika_item_id`
- H: `last_synced_at`

Sync algorithm:
1. Look for the stable item id in column G.
2. If found, update that row.
3. If not found, append a new row.
4. Approved edits update the same row.
5. Archive updates the same row status.

Suggested mapping:
- A: title/topic
- B: approved content/summary
- C: canon/archive status
- D: item type
- E: source note such as approved in writers room
- F: optional next step
- G: stable item id
- H: last sync time

If Sheets sync fails, canon remains approved in Supabase and is marked pending sync. Retry must be idempotent and must not create duplicates.

## Google bridge
Use a small protected Google Apps Script web endpoint owned by the spreadsheet owner.

Flow:
`GitHub Pages → Supabase Edge Function → Google Apps Script → Google Sheet`

The browser never writes to Google Sheets directly. The bridge only accepts upsert-approved-item and archive-item operations.

## AI generator
Add a fixed section in the writers room titled `✨ צור איתי רעיון` with two modes.

### Mode A: Two characters → interaction
Inputs:
- character A
- character B
- optional interaction note/type

Output:
- title
- interaction type
- short premise
- what each character wants
- what happens between them
- sample dialogue
- what changes after the moment
- suggested story placement
- why it fits canon
- possible canon conflicts
- tags

### Mode B: Character + emotion → scene
Inputs:
- character
- emotion
- optional context/location/period/second character

Output:
- scene title
- opening situation
- emotion trigger
- scene beats
- external behavior vs internal feeling
- sample dialogue
- turning point
- ending emotional residue
- suggested placement
- why it fits the character
- what it may open later
- possible canon conflicts
- tags

Every AI result starts as `idea`, never canon.

## AI result actions
- Save as draft
- Edit
- Retry
- Approve
- Delete

Retry uses the same input to create a new variation. A previously saved variation is not overwritten.

## Consult AI
Each proposal card keeps a `Consult AI` action. The consultation receives the current card plus relevant character, plotline, nearby-scene and canon context. AI responses never modify content automatically.

## Existing Supabase assets
The current `my-center` project already contains the main persistence tables:
- `raika_item_edits`
- `raika_item_versions`
- `raika_ai_threads`
- `raika_ai_messages`
- `raika_authorized_users`

Implementation should reuse them rather than build a second storage system.

Additional sync metadata may be stored as dedicated fields or inside the existing payload, whichever proves simpler and safer after inspecting current policies.

## Security boundary
- Private actions require authenticated authorized access.
- AI and Sheets writes run server-side through Supabase functions.
- Private credentials are never placed in public GitHub Pages code.
- The public Raika page remains readable even when AI or Sheets integration is temporarily unavailable.

## UI states
Cards should clearly show:
- Unsaved changes
- Saving
- Saved
- Approved
- Synced to Sheets
- Pending Sheets sync
- Archived

## Error behavior
- Save failure: keep editor contents and allow retry.
- AI failure: normal manual editing/saving continues.
- Sheets failure: approval remains in Supabase, marked pending sync, with retry.
- Invalid AI structure: do not save a malformed proposal.

## Tests
Frontend:
- autosave debounce
- save/edit/delete/approve/archive behavior
- two-character payload
- character+emotion payload
- AI output defaults to idea
- retry preserves saved prior result

Backend:
- authorized access only
- autosave updates the correct item
- approve creates a version and canon status
- archive preserves the item
- AI endpoints reject unauthorized requests

Sheets:
- new approval creates one row
- repeated approval updates the same row
- approved edit updates the same row
- archive updates status without deleting the row
- retry after failure creates no duplicate

## Out of scope for this phase
- multi-author collaboration
- physical deletion of approved canon
- Google Sheets as the main renderer/data source for the public site
- image upload through the writers room
- automatic GitHub `raika-data.js` edits on each approval

## Done criteria
The feature is complete when the authorized user can generate either AI idea type, save/edit/delete drafts, autosave across devices, explicitly approve canon, sync approvals into `העולם שלי` → `עולם ראיקה`, update the same Sheet row after approved edits, and archive approved material without losing its history.
