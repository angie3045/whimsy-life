It should hold a list of things to do should also consider a questionnaire of things that make you happy to do it should also suggest things it similar to what you like that is highlight likely to do

it should store shows to watch it should not always send you to watch something but that is an options as people recommend things we should add things here it should also add restaurants recommended or places recommended so we can add it as a game that we can do

things should be categorized as fun or things to keep live running we should plan a balance day something fun + something to keep life running

I have a bunch of chores and projects to do in my house I have a bunch of hobbies I would like to try I have a bunch of recommendations of things I may want to try

it should have a small local storage or db to capture this

I should be able to easily download it in my phone without many issues and run it in my phone

Want the simplest solution that I can get something working sooner but nice enough

please plan something and start creating tasks

Ask me when you brainstorm here

## Shared implementation foundation — card #11

Card **#11: Build the app foundation with React, TypeScript, and ready-made
components** replaces accidentally closed card **#7**. Cards **#8, #9, and #10**
depend on #11; every reference in those cards to foundation card #7 means #11.

- Use React + TypeScript + Vite, initialized from the official Vite React/TS
  template. Use Mantine components and Mantine forms for standard controls.
- Use Dexie over IndexedDB for local persistence, with explicit database versions
  and migrations. Keep UI (`src/ui`), persistence (`src/data`), and validation/domain
  logic (`src/domain`) separate. Do not add a state framework, backend, accounts,
  paid services, or cloud sync.
- The responsive shell has Today, Life Upkeep, Fun, and Preferences. The foundation
  supports collecting and completing items; richer questionnaires, recommendations,
  and balanced daily planning remain follow-up work.
- Use `vite-plugin-pwa` for the manifest, app icons, offline app shell, and
  user-controlled service-worker updates. The app is accessed through a URL with
  optional home-screen installation, with no app store submission. **#10 owns
  physical iPhone/Android installation and standalone/offline verification.**
- Store items and preferences in the `whimsy` database (schema version 1). JSON
  backups use the independent `whimsy-backup` version 1 format. Validate before
  presenting restoration, require confirmation before replacing, and replace all
  data in one transaction. Unknown backup versions must be rejected safely.
- Inspection for #11 found only this plan: no existing application, persistence
  schema, or user-data files to migrate. Preserve these original product notes.
  Future changes must preserve existing IndexedDB records and supported backups.
- Use current compatible stable free/open-source dependencies and keep
  `package-lock.json` in the eventual approved commit. Node 24 LTS is the recommended
  development runtime; `.nvmrc` and `package.json` specify compatibility.
- Use Vitest, React Testing Library, and fake IndexedDB for behavior tests,
  including reopening storage, invalid backups, cancellation, confirmed
  replacement, and transactional rollback. Run typecheck, tests, lint, and build.
- Ask before deployment, pushing, or publishing. The #11 implementation stays
  unstaged and uncommitted until explicitly approved.
