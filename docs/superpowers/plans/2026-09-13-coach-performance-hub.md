# Coach Performance Hub Implementation Plan

Goal: implement the approved Coach Performance Hub design without changing the static-site architecture.

Spec: docs/superpowers/specs/2026-09-13-coach-performance-hub-design.md

Tasks:
1. Add failing tests for the Hero, six visual topic cards, home dynamic modules, contextual card imagery, and Coach Challenge styling.
2. Build the Coach Hero, six coaching-world cards, the “מה נלמד היום?” module, and “לקחת לאימון הבא”.
3. Add restrained real training imagery to selected feed cards and style one question as Coach Challenge while preserving the existing answer flow.
4. Refresh shared Coach/topic-page styles for desktop and mobile.
5. Run the full Node test suite and JavaScript syntax checks, then open a PR against main.

Constraints: preserve the infinite feed, six topic pages, question interactions, expandable application sections, accessibility, and the separate volleyball center. Use real training photography only and no new framework or runtime dependency.
