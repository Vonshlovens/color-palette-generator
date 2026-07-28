# Color Harmonies Specification

## Harmony Algorithms

### 1. Complementary
Generate a palette based on colors opposite on the color wheel.

**Algorithm:**
- Base color at hue H
- Complement at hue H + 180°

**Output (2 colors):**
1. Base color
2. Complement

### 2. Analogous
Colors adjacent on the wheel for harmonious, cohesive palettes.

**Algorithm:**
- Base color at hue H
- Neighbors at H - 30° and H + 30°

**Output (3 colors):**
1. H - 30°
2. Base (H)
3. H + 30°

### 3. Triadic
Three colors evenly spaced for vibrant, balanced contrast.

**Algorithm:**
- Base color at hue H
- Second at H + 120°
- Third at H + 240°

**Output (3 colors):**
1. Base (H)
2. Second (H + 120°)
3. Third (H + 240°)

### 4. Split-Complementary
Similar to complementary but with two adjacent colors to the complement.

**Algorithm:**
- Base color at hue H
- Split 1 at H + 150°
- Split 2 at H + 210°

**Output (3 colors):**
1. Base (H)
2. Split 1 (H + 150°)
3. Split 2 (H + 210°)

### 5. Tetradic (Rectangle)
Four colors forming a rectangle on the wheel.

**Algorithm:**
- Base at H
- Second at H + 60°
- Third at H + 180°
- Fourth at H + 240°

**Output (4 colors):**
1. Base (H)
2. H + 60°
3. H + 180°
4. H + 240°

### 6. Monochromatic
Single hue with variations in saturation and lightness.

**Algorithm:**
- All colors share hue H
- Vary saturation and lightness across a shade-to-tint ramp

**Output (5 colors):**
1. Dark shade (L: 25%, S: 90%)
2. Medium shade (L: 40%, S: 85%)
3. Base (L: 50%, S: 100%)
4. Light tint (L: 65%, S: 70%)
5. Pale tint (L: 80%, S: 50%)

### 7. 60-30-10
UI-oriented palette with dominant, secondary, and accent roles.

**Algorithm:**
- Dominant (60%): lighter / slightly softer relative offset from the live base
- Secondary (30%): deeper relative offset from the live base
- Accent (10%): complementary hue of the live base

**Output (3 colors):**
1. Dominant — base hue, S-15, L+22
2. Secondary — base hue, S-5, L-22
3. Accent — complement hue, S+10, same L as base

**Preview:**
- Palette swatches use a proportional 6:3:1 layout
- An abstract website mock shows how the roles map onto header, canvas, cards, and CTAs

## Palette Layouts

| Harmony | Count | Layout |
|---------|-------|--------|
| Complementary | 2 | Two equal columns |
| Analogous | 3 | Three equal columns |
| Triadic | 3 | Three equal columns |
| Split-Complementary | 3 | Three equal columns |
| Tetradic | 4 | 2×2 grid |
| Monochromatic | 5 | Five-across row |
| 60-30-10 | 3 | Proportional 60/30/10 widths + website preview |

## Saturation/Lightness Adjustments

### Default Values
- Base saturation: 70%
- Base lightness: 50%
- Tint lightness offset: +20%
- Shade lightness offset: -20%
- Neutral saturation: 20%

### Normalization
- All hue values normalized to 0-360°
- Saturation clamped to 0-100%
- Lightness clamped to 0-100%
