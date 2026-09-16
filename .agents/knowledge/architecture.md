# WaPilot Architecture

The repository README documents the following source boundaries:

src/
- components/ : reusable UI components
- config/ : API/configuration
- screens/ : screen-level composition
- services/ : API and infrastructure services
- store/ : Redux state
- theme/ : design system
- types/ : shared TypeScript types
- utils/ : general/pure utilities
- svg-icons/ : SVG icons

## Dependency direction

Preferred direction:

Screens / Components
    -> Store / Services / Utilities
    -> External APIs / native infrastructure

Business and transformation logic should not be duplicated across multiple screens.

## Services

The documented service layer includes:
- APIService.ts
- authService.ts
- conversationService.ts

Reuse these service conventions instead of creating direct Axios calls inside screens unless there is a clear architectural reason.

## State

Redux Toolkit is part of the stack. Existing slices/store conventions should be inspected before adding state.

Do not introduce another global state-management library without explicit approval.

## UI

Use the existing components, theme, spacing, colors, typography, icons, and styling conventions before creating alternatives.

## Navigation

React Navigation 7 is part of the stack. Follow the existing navigation structure and typed route conventions.

## Realtime

The product requires realtime conversation behavior. Any listener/socket/subscription must have deterministic setup and cleanup and must not create duplicate subscriptions.

## Data loading

Conversation lists and chat histories can become large. Preserve pagination/incremental loading and avoid loading an entire history unnecessarily.

Do not change architectural boundaries without first inspecting the current implementation.
