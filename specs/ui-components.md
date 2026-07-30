# UI Components Specification

## Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  Header: "Color Palette Generator"                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐  ┌───────────────────────────────┐ │
│  │  Color Picker   │  │   Palette Display             │ │
│  │  (selected)     │  │   ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ │
│  │                 │  │   │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │
│  │  ┌───────────┐  │  │   └───┘ └───┘ └───┘ └───┘ └───┘ │
│  │  │  Preview  │  │  │   Click swatch to edit         │ │
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
**Purpose:** Edit the currently selected palette swatch

**Features:**
- Hue slider (0-360°)
- Saturation slider (0-100%)
- Lightness slider (0-100%)
- HEX input field with validation
- Live color preview of the selected swatch
- Randomize seed color (locked swatches stay put)

**State:**
- Bound to the store's `selectedIndex` / selected swatch HSL

**Events:**
- Updates the selected swatch via the palette store

**Notes:**
- Click a swatch in PaletteDisplay to choose which color the picker edits.
- Unlocked edits retarget the canonical base HSL through the harmony inverse so siblings can follow.
- Locked swatches are edited in place without changing the seed.
- Lock other swatches first when you want to isolate a single color.
- Generated palette colors are deterministic from the base HSL + harmony algorithm.
- They are not random unless the user presses Randomize (which only randomizes the seed).
- Locked swatches stay fixed across seed changes and randomize.

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
  - HEX code (click swatch to select for editing; use copy control for clipboard)
  - Selection ring for the swatch currently in the color picker
  - Lock toggle to freeze that slot while other colors change
  - Contrast indicator (light/dark text)
- Hover state reveals full color info
- For 60-30-10: proportional swatches plus an abstract website preview
- Clear-locks action when any swatches are locked

**State:**
- `colors: Color[]`
- `locks: Record<number, Color>`
- `selectedIndex: number`
- `copiedIndex: number | null` (for copy feedback)

**Events:**
- `onSelect(index: number)`
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
- `selected: boolean`
- `onSelect?: (index: number) => void`
- `onToggleLock?: (index: number) => void`

**Features:**
- Click swatch to select it for editing in the color picker
- Separate copy control for HEX clipboard
- Lock button freezes the slot against seed/randomize updates
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
- Each save yields a `/palettes/:slug` share link and appears in the database-backed gallery

### 7. PaletteCard (v3)
**Purpose:** Compact preview of a saved snapshot in the gallery.

**Props:**
- `slug`, `name`, `hue`, `saturation`, `lightness`, `harmony`
- `dateLabel: string` (pre-formatted, e.g. "Created 2026-07-28")

**Features:**
- Swatch strip recomputed client-side via `generatePalette` from the stored HSL + harmony
- Harmony badge (`getHarmonyName`) and created date
- Primary CTA "Open & edit" → `/palettes/:slug` (the workspace supports edit + save-as-new)
- Secondary "Copy link" copies the public share URL

### 8. Palette Gallery page (v3)
**Purpose:** Browse database-backed snapshots at `/palettes`.

**Features:**
- Server-rendered first page (newest first) via `listPalettes`; "Load more" paginates through
  `GET /api/palettes?limit=&offset=`
- Empty state when no snapshots exist yet
- Header matches the Palette Studio chrome with links back to the generator; the generator and
  shared-palette headers link to the gallery

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
