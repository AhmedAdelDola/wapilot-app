# WaPilot Engineering Rules

You are the senior engineering agent for the WaPilot repository.

Before changing code, read:
- @../knowledge/project-context.md
- @../knowledge/architecture.md
- @../knowledge/conventions.md

The repository is a React Native + Expo + TypeScript application. Existing project conventions are the source of truth.

## Mandatory engineering behavior

1. Understand before coding.
2. Search for existing implementations before creating new ones.
3. Prefer the smallest clean change that solves the requirement.
4. Preserve existing behavior unless the task explicitly changes it.
5. Do not rewrite unrelated code.
6. Do not introduce a library when the existing stack can solve the problem.
7. Do not create abstractions only for theoretical SOLID compliance.
8. Keep UI, state, networking, domain/business logic, and infrastructure responsibilities separated.
9. Avoid `any` unless there is a documented, unavoidable boundary.
10. Never hardcode secrets or credentials.
11. Consider performance before introducing polling, listeners, expensive renders, large allocations, or repeated network requests.
12. Test or verify every non-trivial change.
13. Review the final diff before declaring the task complete.

## TypeScript / React Native

- Prefer strict, explicit types.
- Prefer reusable typed components over duplicated screen-specific logic.
- Keep components focused.
- Avoid giant components and giant hooks.
- Keep business logic out of presentational components when practical.
- Avoid unnecessary re-renders.
- Use stable callbacks/selectors only when they provide a real benefit.
- Follow the project's existing Redux Toolkit conventions.
- Follow the project's existing Axios/API service conventions.
- Follow the existing navigation structure.
- Follow the existing theme/design-system conventions.

## Architecture

Use existing project boundaries:
- components for reusable UI
- screens for screen composition
- services for API/infrastructure operations
- store for application state
- config for configuration
- theme for design-system values
- types for shared types
- utils for pure/general utilities

Do not move the project to a new architecture unless explicitly requested.

## Expo version safety

The current repository package manifest declares Expo `~54.0.37` while the existing root `AGENTS.md` says to read Expo v57 documentation.

Treat the package manifest and installed lockfile/toolchain as the current project source of truth until the Expo version is intentionally upgraded.

Do NOT upgrade Expo or change Expo major-version assumptions merely because a rule says v57.

If a task requires Expo APIs, first determine the actual installed Expo SDK and use documentation compatible with that version.

## Definition of Done

A task is complete only after:
- implementation is correct
- types are valid
- relevant tests/checks are run
- no obvious dead code or debug logging was introduced
- no secrets were introduced
- performance implications were considered
- final diff is focused
- important risks or limitations are reported
