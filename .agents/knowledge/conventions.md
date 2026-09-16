# WaPilot Conventions

## General

- TypeScript is the primary language.
- Prefer explicit types at public boundaries.
- Avoid `any`.
- Reuse existing utilities and components.
- Keep changes focused.

## React Native

- Prefer functional components.
- Keep screen components focused on composition.
- Extract reusable UI into components.
- Extract reusable behavior into hooks when appropriate.
- Avoid putting API implementation directly into UI components.

## State

Use the existing Redux Toolkit structure for global/shared state.

Do not duplicate the same server state in multiple unrelated places without a clear synchronization strategy.

## Networking

Use the existing API service layer and existing authentication/header behavior.

Do not scatter Axios calls throughout screens.

## Styling

Reuse the existing theme and styling approach. Do not introduce a second styling system.

## Naming

Use descriptive names.

Avoid generic names such as:
- data
- item
- temp
- manager
- helper
- response2

## Error handling

Follow the existing API/service error conventions. Do not swallow errors silently.

User-facing errors should be separated from internal debugging information.

## Logging

Do not log tokens, authorization headers, passwords, or sensitive conversation/customer content.

## Dependencies

Before adding a dependency:
1. Check whether the existing stack already provides the capability.
2. Check compatibility with the current Expo/React Native versions.
3. Consider bundle size and native build implications.
4. Prefer the existing dependency when it is adequate.
