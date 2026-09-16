# WaPilot Architectural Decisions

Record meaningful architectural decisions here.

Format:

## YYYY-MM-DD - Decision title

Context:
Why the decision was needed.

Decision:
What was chosen.

Reason:
Why it was chosen.

Constraints:
What must remain true.

---

Initial known constraint:

## 2026-09-16 - Do not assume Expo 57

The repository's package.json currently declares Expo ~54.0.37, while AGENTS.md references Expo v57 documentation.

Until the project is intentionally upgraded, implementation should target the actual installed Expo version and should not introduce an Expo major-version migration as a side effect of another task.
