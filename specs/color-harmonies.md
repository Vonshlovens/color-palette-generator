# Color Harmonies Specification

## Harmony Algorithms

### 1. Complementary
Generate a palette based on colors opposite on the color wheel.

**Algorithm:**
- Base color at hue H
- Complement at hue H + 180°
- Fill with tints/shades of both

**Output (5 colors):**
1. Base color (100% saturation)
2. Base tint (70% lightness)
3. Complement (100% saturation)
4. Complement tint (70% lightness)
5. Neutral blend (50% saturation, between both hues)

### 2. Analogous
Colors adjacent on the wheel for harmonious, cohesive palettes.

**Algorithm:**
- Base color at hue H
- Colors at H - 30°, H - 15°, H + 15°, H + 30°

**Output (5 colors):**
1. H - 30°
2. H - 15°
3. Base (H)
4. H + 15°
5. H + 30°

### 3. Triadic
Three colors evenly spaced for vibrant, balanced contrast.

**Algorithm:**
- Base color at hue H
- Second at H + 120°
- Third at H + 240°

**Output (5 colors):**
1. Base (H)
2. Base tint (lighter)
3. Second (H + 120°)
4. Third (H + 240°)
5. Third shade (darker)

### 4. Split-Complementary
Similar to complementary but with two adjacent colors to the complement.

**Algorithm:**
- Base color at hue H
- Split 1 at H + 150°
- Split 2 at H + 210°

**Output (5 colors):**
1. Base (H)
2. Base tint
3. Split 1 (H + 150°)
4. Split 2 (H + 210°)
5. Neutral (desaturated base)

### 5. Tetradic (Rectangle)
Four colors forming a rectangle on the wheel.

**Algorithm:**
- Base at H
- Second at H + 60°
- Third at H + 180°
- Fourth at H + 240°

**Output (5 colors):**
1. Base (H)
2. H + 60°
3. H + 180°
4. H + 240°
5. Neutral bridge

### 6. Monochromatic
Single hue with variations in saturation and lightness.

**Algorithm:**
- All colors share hue H
- Vary saturation: 100%, 80%, 60%, 40%, 20%
- Vary lightness: 20%, 35%, 50%, 65%, 80%

**Output (5 colors):**
1. Dark shade (L: 25%, S: 90%)
2. Medium shade (L: 40%, S: 85%)
3. Base (L: 50%, S: 100%)
4. Light tint (L: 65%, S: 70%)
5. Pale tint (L: 80%, S: 50%)

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
