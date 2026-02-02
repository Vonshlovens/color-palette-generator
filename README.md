# Color Palette Generator

A visual tool for generating harmonious color palettes using color theory algorithms.

## Features

- **6 Harmony Types**: Complementary, Analogous, Triadic, Split-Complementary, Tetradic, Monochromatic
- **Interactive Color Picker**: HSL sliders and HEX input
- **Live Preview**: Real-time palette generation
- **One-Click Copy**: Click any swatch to copy its HEX value
- **Export Options**: CSS variables, Tailwind config, or JSON

## Tech Stack

- Svelte 5 with runes ($state, $props, $effect, $derived)
- SvelteKit for routing
- Tailwind CSS v4 for styling
- TypeScript for type safety

## Development

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

## Project Structure

```
src/
├── lib/
│   ├── components/     # UI components
│   ├── color/          # Color conversion & harmony algorithms
│   ├── stores/         # Reactive state management
│   └── types.ts        # TypeScript definitions
├── routes/             # SvelteKit pages
└── app.css            # Global styles
specs/                  # Design specifications
```
