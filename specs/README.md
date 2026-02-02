# Color Palette Generator - Specifications

A visual tool for generating harmonious color palettes using color theory algorithms.

## Core Concepts

### Color Spaces
- **HSL** (Hue, Saturation, Lightness) - Primary working space for harmony calculations
- **RGB** (Red, Green, Blue) - Display and export format
- **HEX** - Web-standard export format

### Harmony Types
- **Complementary** - Two colors opposite on the wheel (180°)
- **Analogous** - Three colors adjacent on the wheel (30° apart)
- **Triadic** - Three colors evenly spaced (120° apart)
- **Split-Complementary** - Base + two adjacent to complement (150°, 210°)
- **Tetradic** - Four colors in rectangle pattern
- **Monochromatic** - Single hue with varied saturation/lightness

### Palette Output
- 5-color palettes as default
- Each color includes: HEX, RGB, HSL values
- Contrast ratio indicators for accessibility
- Copy-to-clipboard functionality

## User Flow

```
Select Base Color → Choose Harmony Type → Generate Palette → Export/Copy
       ↓                    ↓                    ↓               ↓
  Color Picker        Dropdown/Tabs         Live Preview    HEX/RGB/CSS
```

## Out of Scope (v1)
- Gradient generation
- Image color extraction
- Palette saving/persistence
- Color blindness simulation
- Custom harmony angle adjustments
