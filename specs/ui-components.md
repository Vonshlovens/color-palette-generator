# UI Components Specification

## Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  Header: "Color Palette Generator"                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐  ┌───────────────────────────────┐ │
│  │  Color Picker   │  │   Palette Display             │ │
│  │  (HSL/HEX)      │  │   ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ │
│  │                 │  │   │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │
│  │  ┌───────────┐  │  │   └───┘ └───┘ └───┘ └───┘ └───┘ │
│  │  │  Preview  │  │  │                               │ │
│  │  └───────────┘  │  │   [Copy All]  [Export CSS]    │ │
│  │                 │  │                               │ │
│  │  [H] ████████   │  └───────────────────────────────┘ │
│  │  [S] ████████   │                                    │
│  │  [L] ████████   │  ┌───────────────────────────────┐ │
│  │                 │  │  Harmony Type Selector        │ │
│  │  HEX: #______   │  │  ○ Complementary              │ │
│  │                 │  │  ○ Analogous                  │ │
│  └─────────────────┘  │  ○ Triadic                    │ │
│                       │  ○ Split-Complementary        │ │
│                       │  ○ Tetradic                   │ │
│                       │  ○ Monochromatic              │ │
│                       └───────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Components

### 1. ColorPicker
**Purpose:** Select the base color for palette generation

**Features:**
- Hue slider (0-360°)
- Saturation slider (0-100%)
- Lightness slider (0-100%)
- HEX input field with validation
- Live color preview swatch

**State:**
- `hue: number` (0-360)
- `saturation: number` (0-100)
- `lightness: number` (0-100)

**Events:**
- `onColorChange(hsl: HSL)` - Fires on any slider/input change

### 2. HarmonySelector
**Purpose:** Choose the color harmony algorithm

**Features:**
- Radio button group or segmented control
- Visual icon for each harmony type
- Brief description on hover/focus

**State:**
- `selectedHarmony: HarmonyType`

**Events:**
- `onHarmonyChange(type: HarmonyType)`

### 3. PaletteDisplay
**Purpose:** Show the generated color palette

**Features:**
- 5 color swatches in a row
- Each swatch shows:
  - Color fill
  - HEX code overlay (click to copy)
  - Contrast indicator (light/dark text)
- Hover state reveals full color info

**State:**
- `colors: Color[]`
- `copiedIndex: number | null` (for copy feedback)

**Events:**
- `onColorCopy(index: number)`

### 4. ColorSwatch
**Purpose:** Individual color display unit

**Props:**
- `color: Color`
- `size: 'small' | 'medium' | 'large'`
- `showLabel: boolean`

**Features:**
- Click to copy HEX
- Tooltip with RGB/HSL values
- Auto text color (black/white) based on luminance

### 5. ExportPanel
**Purpose:** Export palette in various formats

**Options:**
- Copy as CSS variables
- Copy as Tailwind config
- Copy as JSON array
- Download as .css file

**Format Examples:**
```css
/* CSS Variables */
:root {
  --color-1: #3b82f6;
  --color-2: #60a5fa;
  ...
}
```

```javascript
// Tailwind
colors: {
  palette: {
    100: '#...',
    200: '#...',
  }
}
```

## Visual Design

### Color Scheme
- Background: `#0f0f0f` (dark) / `#fafafa` (light)
- Surface: `#1a1a1a` (dark) / `#ffffff` (light)
- Text: `#ffffff` (dark) / `#0f0f0f` (light)
- Accent: Dynamic (based on selected color)

### Typography
- Headings: System sans-serif, semibold
- Body: System sans-serif, regular
- Code/HEX: Monospace

### Spacing
- Base unit: 4px
- Component padding: 16px
- Gap between swatches: 12px
- Section margins: 24px
