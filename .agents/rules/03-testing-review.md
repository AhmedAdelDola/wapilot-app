# Testing and Senior Review

For every non-trivial change:

1. Identify the affected behavior.
2. Identify edge cases.
3. Add or update tests when practical.
4. Run the narrowest relevant checks first.
5. Run broader checks when the change affects shared infrastructure.

## Bug fixes

Find the root cause rather than hiding the symptom.

When practical:
- reproduce
- add regression coverage
- fix root cause
- verify related flows

## Final self-review

Before declaring done, inspect the diff and ask:

Architecture:
- Does this fit the existing WaPilot architecture?
- Did I duplicate existing functionality?
- Did I introduce unnecessary coupling?

Code quality:
- Are names clear?
- Is complexity reasonable?
- Is there dead code?
- Did I introduce `any` unnecessarily?

React Native:
- Could this cause unnecessary renders?
- Are effects cleaned up?
- Are async race conditions possible?

API:
- Are errors handled?
- Are requests duplicated?
- Is pagination preserved?
- Are auth headers handled through existing infrastructure?

Security:
- Any secrets?
- Any sensitive logs?
- Any client-side trust of authorization?

Do not declare success merely because TypeScript compiles.
