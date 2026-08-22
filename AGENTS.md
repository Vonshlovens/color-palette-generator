# Agent Guidelines

## Before Making Changes

1. **Read the specs first** - All feature requirements are documented in the `specs/` directory
2. **Understand the architecture** - This is a Svelte 5 + SvelteKit app using runes ($state, $props, $effect)
3. **Follow existing patterns** - Check similar components before creating new ones

## Key Files

- `specs/README.md` - Project overview and core concepts
- `specs/color-harmonies.md` - Harmony algorithm specifications
- `specs/ui-components.md` - UI component requirements
- `src/lib/types.ts` - TypeScript type definitions
- `src/lib/stores/palette.svelte.ts` - Reactive state management
- `src/lib/color/` - Color conversion and harmony functions

## Coding Standards

- Use Svelte 5 runes: `$state`, `$props`, `$effect`, `$derived`
- Keep components focused and single-purpose
- All color values stored internally as HSL
- Export/display as HEX and RGB
- Use Tailwind CSS for styling

## Cursor Cloud specific instructions

- This is a SvelteKit + Svelte 5 app. The package manager is Bun (`bun@1.3.14`), and Bun is installed to `~/.bun/bin` by the startup update script; login shells pick it up automatically via `~/.bashrc`. If a non-login shell can't find `bun`, run `export PATH="$HOME/.bun/bin:$PATH"`.
- Standard commands live in `package.json` scripts and `README.md`; use them directly:
  - Lint/type check: `bun run check`
  - Tests: `bun run test` (Vitest)
  - Build: `bun run build`
  - Dev server: `bun run dev` (Vite on port 5173, not 3000)
- Database: Turso/libSQL via Drizzle. The DB URL defaults to `file:local.db` in code, so `.env` is optional for dev (copy `.env.example` to `.env` only if you need to override). `local.db` is git-ignored and does NOT persist across fresh VMs — run `bun run db:migrate` once before exercising DB-backed features (the `/palettes` gallery and `/api/palettes` endpoints). Migrations are intentionally kept out of the startup update script.
- Quick end-to-end API check while the dev server runs: `curl http://localhost:5173/health` (reports app + database status) and `POST http://localhost:5173/api/palettes` with a flat JSON body `{"name","hue","saturation","lightness","harmony"}`.
