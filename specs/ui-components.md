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
│                       │  ○ 60-30-10                   │ │
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
- Randomize base color (picks a new HSL base; palette remains algorithmic from that base)

**State:**
- `hue: number` (0-360)
- `saturation: number` (0-100)
- `lightness: number` (0-100)

**Events:**
- `onColorChange(hsl: HSL)` - Fires on any slider/input change

**Notes:**
- Generated palette colors are deterministic from the base HSL + harmony algorithm.
- They are not random unless the user presses Randomize (which only randomizes the base).
- Locked swatches stay fixed across base changes and randomize.

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
- Swatch count and grid layout follow the active harmony
- Each swatch shows:
  - Color fill
  - HEX code overlay (click to copy)
  - Lock toggle to freeze that slot while the base color changes
  - Contrast indicator (light/dark text)
- Hover state reveals full color info
- For 60-30-10: proportional swatches plus an abstract website preview
- Clear-locks action when any swatches are locked

**State:**
- `colors: Color[]`
- `locks: Record<number, Color>`
- `copiedIndex: number | null` (for copy feedback)

**Events:**
- `onColorCopy(index: number)`
- `onToggleLock(index: number)`

### 3b. WebsitePreview
**Purpose:** Show how a 60-30-10 palette might appear on a site

**Features:**
- Abstract header, content, cards, sidebar, and CTA blocks
- Maps Dominant / Secondary / Accent to page regions
- Decorative only (non-interactive chrome)

### 4. ColorSwatch
**Purpose:** Individual color display unit

**Props:**
- `color: Color`
- `size: 'small' | 'medium' | 'large'`
- `showLabel: boolean`
- `locked: boolean`
- `onToggleLock?: (index: number) => void`

**Features:**
- Click HEX / label to copy
- Lock button freezes the slot against base/randomize updates
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

### 6. SavePalette (v2)
**Purpose:** Create a named, immutable snapshot of the current palette inputs.

**Features:**
- Name input with client and server validation
- Accessible loading, error, and success status
- Creates a public share URL and navigates to it after saving
- Available in both the generator and shared-palette workspaces

**Persistence:**
- Stores HSL channels and harmony type, not generated HEX/RGB output
- Saving an edited shared palette always creates a new snapshot

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
