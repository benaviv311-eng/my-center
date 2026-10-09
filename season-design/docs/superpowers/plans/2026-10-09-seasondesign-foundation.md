# SeasonDesign Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the standalone SeasonDesign shell with Google sign-in, PWA behavior, saved groups, and separate skill levels per group.

**Architecture:** `season-design/` is an isolated Next.js application. Supabase provides authentication and PostgreSQL persistence. A small IndexedDB read-cache keeps previously viewed safe summaries available when connectivity is weak. The first shipped slice lets a coach sign in, create a group, and maintain the group's skill profile on desktop or mobile.

**Tech Stack:** Next.js, TypeScript, Supabase/PostgreSQL, Supabase Auth, Vitest, Testing Library, Playwright, Serwist PWA, IndexedDB, Vercel.

**Spec:** `season-design/docs/superpowers/specs/2026-10-09-seasondesign-design.md`

## Global Constraints

- Runtime must not depend on the existing `my-center` application.
- Version 1 is private/invite-only but supports multiple coaches in the data model.
- Google sign-in is the authentication method.
- Database policies enforce ownership of private coach data.
- The five skill levels are `beginner`, `basic`, `intermediate`, `advanced`, `competitive`.
- Approved level and future system-recommended level remain separate fields.
- Previously loaded safe summaries may be shown offline; offline writes never report success until confirmed by the server.

## Review Focus

- A coach cannot access another coach's private group data.
- Missing authentication produces a login flow rather than a broken protected page.
- New groups render all canonical skills even before levels are explicitly saved.
- Previously viewed group information remains readable during weak connectivity without exposing stale data as current.
- Empty names and invalid player counts are rejected consistently.

---

### Task 1: App shell, tests, and PWA

**Files:**
- Create: `season-design/package.json`
- Create: `season-design/next.config.ts`
- Create: `season-design/tsconfig.json`
- Create: `season-design/vitest.config.ts`
- Create: `season-design/playwright.config.ts`
- Create: `season-design/app/layout.tsx`
- Create: `season-design/app/page.tsx`
- Create: `season-design/app/globals.css`
- Create: `season-design/public/manifest.webmanifest`
- Create: `season-design/app/offline/page.tsx`
- Test: `season-design/tests/app-shell.test.tsx`

**Interfaces:**
- Produces npm scripts `dev`, `build`, `lint`, `test`, `test:e2e` and an installable RTL application shell.

- [ ] **Step 1: Write the failing shell test** for product name, RTL direction, and standalone navigation.
- [ ] **Step 2: Run `npm test -- tests/app-shell.test.tsx`**; expected FAIL.
- [ ] **Step 3: Scaffold the minimal App Router project** with Vitest/Testing Library and Playwright.
- [ ] **Step 4: Configure the PWA shell** with manifest, offline route, and static/app-shell caching only.
- [ ] **Step 5: Run `npm test && npm run build`**; expected PASS.
- [ ] **Step 6: Commit** `feat: scaffold SeasonDesign foundation`.

### Task 2: Authentication and protected app layout

**Files:**
- Create: `season-design/lib/supabase/browser.ts`
- Create: `season-design/lib/supabase/server.ts`
- Create: `season-design/lib/auth/current-user.ts`
- Create: `season-design/middleware.ts`
- Create: `season-design/app/login/page.tsx`
- Create: `season-design/app/auth/callback/route.ts`
- Create: `season-design/app/(app)/layout.tsx`
- Create: `season-design/.env.example`
- Test: `season-design/tests/auth-routing.test.ts`

**Interfaces:**
- Produces `getCurrentUser(): Promise<{ id: string; email: string } | null>` and a protected `(app)` route group.

- [ ] **Step 1: Write failing tests** for unauthenticated redirect, authenticated access, and callback failure.
- [ ] **Step 2: Run the auth test**; expected FAIL.
- [ ] **Step 3: Implement Supabase browser/server clients and `getCurrentUser()`**.
- [ ] **Step 4: Implement Google login/callback and private-access check**.
- [ ] **Step 5: Run tests**; expected PASS.
- [ ] **Step 6: Commit** `feat: add SeasonDesign sign in`.

### Task 3: Group and skill database

**Files:**
- Create: `season-design/supabase/config.toml`
- Create: `season-design/supabase/migrations/202610090001_core_groups.sql`
- Create: `season-design/supabase/tests/core_groups.sql`
- Create: `season-design/features/groups/types.ts`
- Create: `season-design/features/groups/schema.ts`

**Interfaces:**
- Produces tables `profiles`, `groups`, `skills`, `group_skill_levels`, `skill_level_history`.
- Produces types `SkillLevel`, `Group`, `GroupSkillLevel`.

- [ ] **Step 1: Write failing database tests** for ownership and canonical skill visibility.
- [ ] **Step 2: Run `supabase test db`**; expected FAIL.
- [ ] **Step 3: Create migration** with the five exact levels and canonical skills: forearm pass, overhead setting, serve, attack, block, defense, reception, coverage, transitions.
- [ ] **Step 4: Add ownership policies** for group and group-skill records.
- [ ] **Step 5: Run `supabase test db`**; expected PASS.
- [ ] **Step 6: Commit** `feat: add group skill data model`.

### Task 4: Group repository and actions

**Files:**
- Create: `season-design/features/groups/repository.ts`
- Create: `season-design/features/groups/actions.ts`
- Test: `season-design/features/groups/repository.test.ts`

**Interfaces:**
- Produces `listGroups()`, `getGroup(groupId)`, `createGroup(input)`, `updateGroup(groupId,input)`, `setApprovedSkillLevel(groupId,skillId,level)`.

- [ ] **Step 1: Write failing tests** for create/list/update, empty name, invalid player count, and invalid level.
- [ ] **Step 2: Run targeted tests**; expected FAIL.
- [ ] **Step 3: Implement validated repository/actions** using the authenticated coach context.
- [ ] **Step 4: Run targeted tests**; expected PASS.
- [ ] **Step 5: Commit** `feat: add group persistence`.

### Task 5: Group screens

**Files:**
- Create: `season-design/app/(app)/groups/page.tsx`
- Create: `season-design/app/(app)/groups/new/page.tsx`
- Create: `season-design/app/(app)/groups/[groupId]/page.tsx`
- Create: `season-design/features/groups/group-form.tsx`
- Create: `season-design/features/groups/skill-profile.tsx`
- Create: `season-design/features/navigation/app-nav.tsx`
- Test: `season-design/e2e/groups.spec.ts`

**Interfaces:**
- Consumes group actions from Task 4.
- Produces saved-group list, create/edit flow, and skill-level editor.

- [ ] **Step 1: Write failing E2E test** creating a named group with broad age category, free-form age label, and player count, then assigning different levels to reception and serve.
- [ ] **Step 2: Run the E2E test**; expected FAIL.
- [ ] **Step 3: Implement responsive group pages and mobile navigation**.
- [ ] **Step 4: Render unsaved canonical skills safely and persist only explicit changes**.
- [ ] **Step 5: Run `npm test && npm run test:e2e && npm run build`**; expected PASS.
- [ ] **Step 6: Commit** `feat: add saved group profiles`.

### Task 6: Offline read snapshot contract

**Files:**
- Create: `season-design/lib/offline/read-cache.ts`
- Create: `season-design/features/groups/offline-group-snapshot.tsx`
- Test: `season-design/lib/offline/read-cache.test.ts`
- Test: `season-design/e2e/groups-offline.spec.ts`

**Interfaces:**
- Produces `putOfflineSnapshot<T>(key,value,updatedAt): Promise<void>` and `getOfflineSnapshot<T>(key): Promise<{ value:T; updatedAt:string } | null>`.
- Group screens cache successful safe read models; later plans reuse the same contract for saved-practice/program summaries.

- [ ] **Step 1: Write failing cache tests** for put/get, missing key, replacement, and per-user key namespace.
- [ ] **Step 2: Write failing E2E test** that loads a group, loses network, reopens the viewed group summary, and sees an explicit offline/stale indicator.
- [ ] **Step 3: Implement IndexedDB read-cache wrapper and group fallback component**.
- [ ] **Step 4: Ensure mutations remain disabled/failed clearly while offline** rather than queued as successful writes.
- [ ] **Step 5: Run tests**; expected PASS.
- [ ] **Step 6: Commit** `feat: cache safe offline read snapshots`.

### Task 7: Foundation acceptance

**Files:**
- Create: `season-design/README.md`
- Test: `season-design/e2e/foundation.spec.ts`

**Interfaces:**
- Produces a documented, deployable foundation for all later plans.

- [ ] **Step 1: Add acceptance coverage** for sign-in, group creation, ownership isolation, offline shell fallback, and cached group read fallback.
- [ ] **Step 2: Run `npm run lint && npm test && npm run test:e2e && npm run build`**; all expected PASS.
- [ ] **Step 3: Document local/deployment configuration** without storing credentials in the repository.
- [ ] **Step 4: Commit** `test: verify SeasonDesign foundation`.
