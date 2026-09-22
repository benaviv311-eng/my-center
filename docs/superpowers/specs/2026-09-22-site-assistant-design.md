# Site Assistant Design

Date: 2026-09-22
Status: Approved in chat and authorized for implementation with "צור"

## Goal
Allow the owner to talk to the assistant from inside "המרכז שלי", keep conversation history and page context, and turn approved chat instructions into safe GitHub-backed site edits without exposing secrets in the browser.

## Product experience
- A floating "דבר איתי" control is available across the main My Center pages.
- Desktop opens a side drawer; mobile opens a near-full-screen chat drawer.
- The assistant receives current page context: pathname, title, heading, area, visible text, and an explicitly selected element when the user uses "בחר מהעמוד".
- Two conversation scopes remain available: global and area-specific.
- Conversation history and durable memories are stored in Supabase and require the existing private login.
- The user can attach up to 4 images to a message.

## Editing flow
1. User asks for a change.
2. site-chat sends source-edit intent to site-editor.
3. site-editor builds a SHA-pinned edit plan from relevant repository files.
4. User approves the plan.
5. A dedicated site-edit branch is created and committed.
6. GitHub Actions validates that exact branch head.
7. Preview is available for medium/high risk requests.
8. User explicitly approves publication.
9. The exact validated head is merged into main.
10. The request reaches deployed only after GitHub Pages reports a successful deployment for that merge SHA.

No force push is permitted. If main moved or the branch head changed, publication stops with stale-plan state.

## Security
- Browser code uses only the Supabase publishable key.
- OpenAI API key, service-role key, GitHub App credentials and mutation logic live only in Supabase Edge Functions.
- site-editor requires an authenticated user who is also present in app_owners.
- GitHub mutations use a GitHub App installation token.
- Edit plans block secret-like paths, private keys, .git and environment files.
- Existing RLS keeps chat data private by user.
- Image bucket remains private and returns short-lived signed URLs.

## Existing infrastructure reused
- Frontend: site-chat.js, site-chat.css, site-editor-ui.js, site-editor-ui.css
- Backend: supabase/functions/site-chat, site-editor, site-preview, shared editor modules
- Database: site_chat_* and site_edit_* tables
- Storage: site-chat-images
- Validation workflow: .github/workflows/site-editor-validation.yml

## Integration strategy
- app.js is the global bootstrap for the main site and loads chat/editor assets exactly once.
- Standalone pages that do not load app.js keep their direct includes.
- Independent mini-apps under double/, team-score/, volleyball-app/ are outside this first integration boundary unless they already load the main shell.

## Success criteria
- Main pages that load app.js show the chat without per-page markup changes.
- Existing standalone chat pages keep working without duplicate UI.
- Authenticated chat can load history and send a message with page context.
- Source-edit requests create an approval card.
- After branch validation, the user sees a publish approval button.
- Publish merges only the exact validated head and never uses force.
- The feature has automated tests and passes the full Node suite before merge.