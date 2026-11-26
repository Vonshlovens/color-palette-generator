# Color Palette Generator - Specifications

A visual tool for generating harmonious color palettes using color theory algorithms.

## Core Concepts

### Color Spaces
- **HSL** (Hue, Saturation, Lightness) - Primary working space for harmony calculations
- **RGB** (Red, Green, Blue) - Display and export format
- **HEX** - Web-standard export format
- **OKLCH** - Perceptual readout and export format; also drives the 50–950 shade scales

### Harmony Types
- **Complementary** - Two colors opposite on the wheel (180°)
- **Analogous** - Three colors adjacent on the wheel (±30°)
- **Triadic** - Three colors evenly spaced (120° apart)
- **Split-Complementary** - Base + two adjacent to complement (150°, 210°)
- **Tetradic** - Four colors in rectangle pattern
- **Monochromatic** - Single hue with varied saturation/lightness
- **60-30-10** - Dominant, secondary, and accent roles for UI systems

### Palette Output
- Color count and layout follow the selected harmony (not a fixed five-swatch grid)
- Each color includes: HEX, RGB, HSL values
- Each color also shows its OKLCH value and WCAG contrast against white and black
- Copy-to-clipboard functionality
- Live UI previews (website, editorial, dashboard, specimen) in light and dark modes

## Studio (v4)

- **Harmony wheel:** a 2D hue × saturation picker (lightness from the slider) with a draggable
  marker per swatch; arrow keys adjust the selected swatch.
- **History:** every edit is undoable (⌘Z / ⇧⌘Z). Rapid edits to the same control within 700 ms
  collapse into one step; loading a preset is undoable.
- **Shortcuts:** Space shuffles the seed (locked swatches stay), L toggles the selected lock, 1–5
  select swatches. Space still presses a control that was focused from the keyboard.
- **Presets:** curated HSL seed + harmony starting points, loaded through history.
- **Fine-tuning:** each swatch card can lighten or darken by 4% and lock in place.
- **Inspect:** 50–950 OKLCH shade scale per color, an N×N WCAG contrast matrix (AAA ≥ 7,
  AA ≥ 4.5, AA large ≥ 3), and color-vision simulation (Machado 2009 protan/deutan/tritan
  matrices plus achromatopsia) that flags pairs whose ΔE OK drops below 0.06.
- **Previews:** palette colors map onto canvas, surface, ink, primary, secondary, and accent
  roles. 60-30-10 keeps its dominant/secondary/accent roles; other harmonies tint neutrals from
  the first color. Previews can be viewed through any CVD filter.
- **Exports:** CSS variables (HEX with an OKLCH `@supports` upgrade), Tailwind v4 `@theme` with
  50–950 OKLCH scales, W3C DTCG JSON tokens, SCSS variables + map, and a 1200×630 SVG card.
- **Ambient theme:** the page accent and background wash follow the live palette.

## User Flow

```
Select Swatch → Adjust Color → Choose Harmony → Export/Copy/Save
       ↓              ↓              ↓               ↓
  Click palette    HSL / HEX     Dropdown/Tabs    HEX/RGB/CSS
```

Unlocked swatch edits retarget the canonical base through the harmony inverse. Lock siblings
to keep them fixed while editing one role.

## Saved Palettes (v2)

- A user can name and save the current generator state as an immutable public snapshot.
- A snapshot stores only canonical HSL values, harmony type, name, slug, and timestamps.
- Generated RGB/HEX arrays are recalculated from the canonical inputs and are never persisted.
- Shared routes hydrate the browser palette workspace and can be edited locally, then saved as a
  new snapshot. Existing snapshots are never updated or deleted.
- After save, the app navigates to `/palettes/:slug` (the public share link).
- No account or ownership model is implied; share links are public.

### Gallery (v3)

- `/palettes` is a gallery of database-backed snapshots (Cloudflare D1), newest first,
  server-rendered with paginated "load more" via `GET /api/palettes`.
- Each gallery card previews the palette (recomputed client-side from the stored HSL + harmony),
  links to `/palettes/:slug` to open the snapshot in the editor, and offers a copy-share-link
  action. Editing a snapshot and saving always creates a new snapshot.

## Out of Scope
- Gradient generation
- Image color extraction
- Custom harmony angle adjustments
- Updating or deleting saved snapshots
- Authentication and private palettes
