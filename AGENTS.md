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
