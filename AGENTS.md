# AGENTS.md

Expo (SDK 54) / React Native 0.81 app with expo-router, TypeScript, and NativeWind v4 (Tailwind). Car-sharing app "Vai de Boa" (VDB). No tests, no lint config, no CI.

## Commands

- `npm run start` / `npm run android` / `npm run ios` / `npm run web` — dev server. There are no test/lint scripts; verify manually and with `npx tsc --noEmit`.
- Use `npm` (package-lock.json + `.npmrc` with `legacy-peer-deps=true`). Don't add test/lint tooling without being asked.

## Setup gotchas

- `.env` is gitignored. Create it from `.env.example` with `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`. Read it via `process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` (search.tsx, components/offer/*.tsx). `env.d.ts` declares a stale `@env` module — ignore it, it's unused.
- Backend base URL is hardcoded in `src/services/api.js:4` to a dev-machine LAN IP. The app will not reach the backend until this is changed to the running backend's IP. Endpoints require `Authorization: Bearer <token>`.

## Architecture

- Routes live in `src/app/` as expo-router route groups: `(auth)` login/signup, `(user)` tabs + ride-details, `(message)` status screen. `experiments.typedRoutes` is on.
- Auth token: `src/services/storage.js` (`setToken`/`getToken`/`resetToken`) — SecureStore on native, localStorage on web. Login POSTs `/authenticate` and stores the raw token string. Root `src/app/index.tsx` validates the token and redirects.
- Screens must `import "@/global.css"` for NativeWind to work; follow existing screens.
- UI strings and git commit messages are in PT-BR.

## Conventions

- Path alias `@/` → repo root (babel `module-resolver` + tsconfig `paths`), so imports look like `@/components/ui/input` or `@/src/services/api`. No `src/` prefix for components; `@/src/...` for services.
- Styling via NativeWind `className` with custom Tailwind colors defined in `src/styles/colors.ts` (used through `tailwind.config.js`): `velvet-orchid`, `purple-x11`, `platinum`, `vintage-grape`, `ash-grey`, `silver`. Dark surfaces use `#120e15` (vintage-grape-950). Don't add ad-hoc hex colors where a palette color fits.
- Shared UI primitives live in `components/ui/` (gluestack-ui based: `Input`, `Button`, `Radio`, `Icon`, `Spinner`); feature components in `components/` (`offer/`, `search/`, `account/`).
- SVGs are imported as components (react-native-svg-transformer in `metro.config.js`), e.g. `logo-vdb.svg` → `<Logo />`. Don't use `Image` with `.svg`.
- Restart the Metro/dev server after editing `tailwind.config.js` or `global.css`.
