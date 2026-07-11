# Prompt template: implement one feature

Read the product documents and inspect the current code.

Feature:
[WRITE ONE SMALL FEATURE HERE]

Phase 1 — no code:
- Restate the user outcome.
- List assumptions.
- List files that need changes.
- Define data model and authorization checks.
- Define loading, empty, error and success states.
- Define manual acceptance tests.
- Identify privacy risks.
- Propose the smallest implementation.

Phase 2 — implementation:
Implement only the approved scope.
Do not refactor unrelated files.
Do not add dependencies without approval.
Run:
- npm run typecheck
- npm run lint
- npm run build

Then provide:
- changed files;
- test instructions;
- known limitations;
- one suggested next task.
