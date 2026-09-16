# WaPilot Project Context

Repository: AhmedAdelDola/wapilot-app

Current default branch: master.

## Product

The repository is a React Native mobile application described in the README as a custom Chatwoot-style mobile app / Message Pro App.

The main documented flows are:
- authentication
- conversations list
- chat
- realtime updates
- push notifications

## Stack observed in package.json

- React 19.1.0
- React Native 0.81.5
- Expo ~54.0.37
- TypeScript 5.3.x
- Redux Toolkit
- React Redux
- Redux Persist
- Axios
- React Navigation 7
- @shopify/flash-list
- React Native Firebase App/Messaging
- Reanimated 4
- Gesture Handler
- WebView
- AsyncStorage
- React Hook Form
- Tailwind/twrnc
- react-native-svg

Package manager commands documented by the repository use pnpm.

## Existing root instructions

The repository already contains `AGENTS.md`, and `CLAUDE.md` references it.

Current AGENTS.md contains an instruction to read Expo v57 docs. This conflicts with package.json, which currently declares Expo ~54.0.37.

Do not silently resolve that conflict by upgrading the project. Verify the actual installed SDK/toolchain before any Expo-specific change.

## Important repository files

- App.tsx: main application entry
- app.config.ts: Expo application configuration
- src/: application source
- package.json: dependencies and scripts
- tsconfig.json: TypeScript configuration
- metro.config.js: Metro configuration
- babel.config.js: Babel configuration
- AGENTS.md: existing agent instruction
- CLAUDE.md: references AGENTS.md
- README.md: project overview and documented architecture

Never put real credentials or secrets into this knowledge file.
