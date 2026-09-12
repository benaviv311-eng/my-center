# Raika Writers Room Google Sheets Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sync explicitly approved Raika writers-room content to `העולם שלי` → `עולם ראיקה`, update the same row after approved edits, and preserve archived canon.

**Architecture:** Supabase remains the source of truth. Approved/archive state is sent server-side to a Google bridge and upserted by a stable item ID in column G; H stores sync time. Failures remain retryable and never roll back canon/archive state.

**Tech Stack:** Supabase Edge Functions, Google Apps Script, Google Sheets, Node built-in test runner.

**Spec:** `docs/superpowers/specs/2026-09-12-raika-writers-room-cloud-sync-design.md`

## Global Constraints
- Drafts never sync.
- Approved edits update the same managed row.
- Archive does not delete Sheet history.
- Column G is the stable writers-room item ID; column H is last sync time.
- Retry is idempotent.
- Browser code never contains Google write authorization material.

---

Implementation tasks are split into focused companion files so each can be reviewed independently:

1. `2026-09-12-raika-sheets-row-and-bridge-task.md` — exact A:H row contract and Google-side upsert/archive bridge.
2. `2026-09-12-raika-sheets-supabase-task.md` — server sync helper, retry semantics, and `payload._sync` state.
3. `2026-09-12-raika-sheets-ui-verification-task.md` — sync badges, retry UI, and end-to-end verification.

Execute them in that order.
