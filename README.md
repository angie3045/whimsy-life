# Whimsy

A local space for everyday care and things you enjoy. Foundation card **#11**
replaces #7 and is the shared dependency for #8, #9, and #10; see [Plan.md](Plan.md).

## Setup and development

Use Node **24 LTS, at least 24.15.0** (or Node 22.22.2+ on the 22 line).
With nvm, run `nvm install` and `nvm use` to use `.nvmrc`.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. For development on another device on your
network, use `npm run dev -- --host 0.0.0.0`. Service workers require HTTPS or
localhost; an HTTP LAN address is for layout checks only.

## Checks and production build

```sh
npm run typecheck
npm test
npm run lint
npm run build
npm run preview
```

`npm run test:watch` runs interactive tests. Vitest + React Testing Library test
navigation, form validation, completion, remount persistence, and import
confirmation/cancellation. Dexie tests use fake-indexeddb to check close/reopen,
backup round trips, malformed/unsupported/duplicate records, and transaction
rollback after a simulated storage failure.

The build writes static files to `dist/`, including the manifest and service
worker. Preview serves the production build locally; it does not deploy it.
Hosting should serve `dist/` at an origin root over HTTPS. Keep the origin stable
to retain access to browser data. Ask before deployment or publishing.

## App and architecture

Created from the official [Vite React TypeScript template](https://vite.dev/guide/),
using [Mantine](https://mantine.dev/guides/vite/) components and forms.
React 19, Mantine 9, Vite 8, TypeScript 6, Dexie 4, and vite-plugin-pwa 2
are pinned to reproducible resolutions by `package-lock.json`.
All dependencies are free/open-source; no accounts, backend, paid services, or
cloud sync are required.

- `src/ui/`: Mantine collection, preferences, and service-worker prompts.
- `src/App.tsx`: responsive navigation and Today overview.
- `src/domain/backup.ts`: item/preferences types and strict Zod backup validation.
- `src/data/database.ts`: database schema, reads/writes, atomic backup operations.
- `src/test/`: browser test shims; behavior tests live next to their modules.
- `scripts/generate-icons.mjs`: regenerate PNG icons from `public/icon.svg` with
  `npm run icons`.

Today links to Life Upkeep and Fun with pending counts and clear empty states.
Both collections support adding and completing items. Preferences offers
appearance settings and backups. Advanced daily planning and recommendations
belong to subsequent cards.

## Storage and migration

Items and preferences are saved in the **`whimsy` IndexedDB database, version 1**.
Dexie live queries refresh the UI after writes, including changes in other tabs.
The database persists across reloads and browser restarts on the same origin and
browser profile. This is local storage, not a backup: private browsing, browser
data clearing, device storage eviction, or a different URL/profile can remove
access to it.

The initial repository contained only Plan.md, with no app or storage schema to
migrate. Future schema changes must retain the v1 declaration, add a new Dexie
version with an explicit migration where needed, and test existing records
surviving upgrades. Never delete/recreate the database as an upgrade strategy.
The database version and JSON backup version are separate contracts.

## Export and restore

1. Open **Preferences → Export backup** and save the downloaded JSON file.
2. To restore or move devices, open **Preferences → Import backup** and choose it.
3. Review the item count and replacement warning. **Cancel** leaves data unchanged.
   **Replace all data** replaces every item and preference in this browser.

Export includes completed items and appearance preferences. The JSON envelope has
`format: "whimsy-backup"`, `version: 1`, `exportedAt`, `items`, and `preferences`.
Imports reject malformed JSON, unknown formats/versions/fields, invalid values,
duplicate IDs, more than 10,000 items, or files over 5 MiB. Invalid files never
write to storage. A confirmed replacement runs in one transaction so a write
failure rolls back both items and preferences. Keep an export before replacing.
Future format changes must provide an explicit validated migration or reject
unsupported versions without writing.

## PWA and mobile verification

`vite-plugin-pwa` generates a standard manifest and caches the app shell after
the first online visit. A visible prompt offers a reload when an update is
ready, avoiding automatic reloads during entry. User data lives in IndexedDB,
independently of the service-worker asset cache.

The layout uses responsive Mantine components, a two-column navigation grid on
small phones, and single-column content on narrow screens. Optional home-screen
installation needs a secure hosted URL and a supporting browser. **Physical
iPhone/Android installation, standalone launch, offline reopening, and upgrade
verification are explicitly owned by card #10**, not claimed by the unit tests.
No app store submission is needed.
