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
Select Base Color → Choose Harmony Type → Generate Palette → Export/Copy
       ↓                    ↓                    ↓               ↓
  Color Picker        Dropdown/Tabs         Live Preview    HEX/RGB/CSS
```

## Saved Palettes (v2)

- A user can name and save the current generator state as an immutable public snapshot.
- A snapshot stores only canonical HSL values, harmony type, name, slug, and timestamps.
- Generated RGB/HEX arrays are recalculated from the canonical inputs and are never persisted.
- Shared routes hydrate the browser palette workspace and can be edited locally, then saved as a
  new snapshot. Existing snapshots are never updated or deleted.
- No account or ownership model is implied; share links are public.

## Out of Scope
- Gradient generation
- Image color extraction
- Color blindness simulation
- Custom harmony angle adjustments
- Updating or deleting saved snapshots
- Authentication and private palettes
