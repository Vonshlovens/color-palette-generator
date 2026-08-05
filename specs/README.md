# Color Palette Generator - Specifications

A visual tool for generating harmonious color palettes using color theory algorithms.

## Core Concepts

### Color Spaces
- **HSL** (Hue, Saturation, Lightness) - Primary working space for harmony calculations
- **RGB** (Red, Green, Blue) - Display and export format
- **HEX** - Web-standard export format

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
- Contrast ratio indicators for accessibility
- Copy-to-clipboard functionality
- 60-30-10 also shows an abstract website preview

## User Flow

```
Select Swatch → Adjust Color → Choose Harmony → Export/Copy/Save
       ↓              ↓              ↓               ↓
  Click palette  HSL / HEX / RGB Dropdown/Tabs    HEX/RGB/CSS
```

Unlocked swatch edits retarget the canonical base through the harmony inverse. Lock siblings
to keep them fixed while editing one role.

## Saved Palettes (v2)

- A user can name and save the current generator state as an immutable public snapshot.
- A snapshot stores canonical base HSL values, any locked swatch HSL overrides, harmony type, name,
  slug, and timestamps.
- Generated RGB/HEX arrays are recalculated from those canonical HSL values and are never persisted.
- Shared routes hydrate the browser palette workspace and can be edited locally, then saved as a
  new snapshot. Existing snapshots are never updated or deleted.
- After save, the app navigates to `/palettes/:slug` (the public share link).
- No account or ownership model is implied; share links are public.

### Gallery (v3)

- `/palettes` is a gallery of database-backed snapshots (Turso or local SQLite), newest first,
  server-rendered with paginated "load more" via `GET /api/palettes`.
- Each gallery card previews the palette (recomputed client-side from the stored HSL + harmony),
  links to `/palettes/:slug` to open the snapshot in the editor, and offers a copy-share-link
  action. Editing a snapshot and saving always creates a new snapshot.

## Out of Scope
- Gradient generation
- Image color extraction
- Color blindness simulation
- Custom harmony angle adjustments
- Updating or deleting saved snapshots
- Authentication and private palettes
