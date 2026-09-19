# Site Editor Through Chat — Implementation Roadmap

**Spec:** `docs/superpowers/specs/2026-09-19-site-editor-through-chat-design.md`

The approved design spans four substantial subsystems, so implementation is split into four independently reviewable plans rather than one oversized change.

1. `2026-09-19-site-editor-core-plan.md` — persistence, owner authorization, GitHub App client, validated edit plans, and approval-gated branch commits.
2. `2026-09-19-site-editor-chat-ui-plan.md` — Edit/Work modes, change cards, selected-element editing, image-assisted editing, and request history/status.
3. `2026-09-19-site-editor-preview-publish-plan.md` — validation workflow, preview service, exact-SHA publish approval, merge/deploy monitoring, and bounded repair.
4. `2026-09-19-site-editor-supabase-rollback-plan.md` — high-risk Supabase deployment and safe source/database rollback.

Execution is sequential. Each plan must end with a green full Node suite and its own verification before the next plan begins. The feature is complete only when the original design acceptance criteria are rechecked after all four plans are integrated.
