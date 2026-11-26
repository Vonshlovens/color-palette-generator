import { z } from 'zod';
import { generatePalette, HARMONY_COLOR_COUNTS } from '$lib/color/harmonies';
import { HARMONY_TYPES, MAX_PALETTE_COLORS, MIN_PALETTE_COLORS } from '$lib/types';

const paletteNameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(80, 'Name must be 80 characters or less');

const hslSchema = z
  .object({
    h: z.number().finite().min(0).max(360),
    s: z.number().finite().min(0).max(100),
    l: z.number().finite().min(0).max(100)
  })
  .strict();

const colorsSchema = z
  .array(hslSchema)
  .min(MIN_PALETTE_COLORS, `A palette needs at least ${MIN_PALETTE_COLORS} color`)
  .max(MAX_PALETTE_COLORS, `A palette holds at most ${MAX_PALETTE_COLORS} colors`);

/**
 * A harmony studio palette. `colors` are the exact swatches on screen; clients from before they
 * were saved send only the seed, and their swatches are generated from it.
 */
const harmonyPaletteSchema = z
  .object({
    name: paletteNameSchema,
    hue: z.number().finite().min(0).max(360),
    saturation: z.number().finite().min(0).max(100),
    lightness: z.number().finite().min(0).max(100),
    harmony: z.enum(HARMONY_TYPES),
    colors: colorsSchema.optional()
  })
  .strict()
  .refine((palette) => !palette.colors || palette.colors.length === HARMONY_COLOR_COUNTS[palette.harmony], {
    path: ['colors'],
    message: 'Swatch count does not match the harmony'
  });

/** A freeform palette: only its swatches. */
const freeformPaletteSchema = z
  .object({
    name: paletteNameSchema,
    harmony: z.literal('freeform'),
    colors: colorsSchema
  })
  .strict();

export const createPaletteSchema = z
  .discriminatedUnion('harmony', [harmonyPaletteSchema, freeformPaletteSchema])
  .transform((palette) => {
    if (palette.harmony === 'freeform') {
      // The seed columns are required, so a freeform palette stores its first swatch there.
      const [first] = palette.colors;
      return { ...palette, hue: first.h, saturation: first.s, lightness: first.l };
    }
    const colors =
      palette.colors ??
      generatePalette(
        { h: palette.hue, s: palette.saturation, l: palette.lightness },
        palette.harmony
      ).map((color) => color.hsl);
    return { ...palette, colors };
  });

export const renamePaletteSchema = z.object({ name: paletteNameSchema }).strict();

export const paletteSlugSchema = z.string().regex(/^[A-Za-z0-9_-]{8,32}$/);

export const PALETTE_LIST_MAX_LIMIT = 50;
export const PALETTE_LIST_DEFAULT_LIMIT = 24;
export const PALETTE_LIST_MAX_OFFSET = 10_000;

export const listPalettesQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PALETTE_LIST_MAX_LIMIT)
    .default(PALETTE_LIST_DEFAULT_LIMIT),
  offset: z.coerce.number().int().min(0).max(PALETTE_LIST_MAX_OFFSET).default(0)
});

export type CreatePaletteInput = z.output<typeof createPaletteSchema>;
export type ListPalettesQuery = z.infer<typeof listPalettesQuerySchema>;

/** The JSON error body for a failed parse, shared by every palette endpoint. */
export function invalidRequest(message: string, error: z.ZodError) {
  return {
    error: {
      code: 'INVALID_REQUEST',
      message,
      issues: error.issues.map((issue) => ({
        field: issue.path.map(String).join('.'),
        message: issue.message
      }))
    }
  };
}
