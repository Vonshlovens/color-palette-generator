import { z } from 'zod';
import { HARMONY_COLOR_COUNTS } from '$lib/color/harmonies';
import { HARMONY_TYPES } from '$lib/types';

const hslChannelSchema = z.number().finite().min(0).max(100);

const lockedSwatchSchema = z
  .object({
    index: z.number().int().min(0).max(4),
    h: z.number().finite().min(0).max(360),
    s: hslChannelSchema,
    l: hslChannelSchema
  })
  .strict();

export const createPaletteSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(80, 'Name must be 80 characters or less'),
    hue: z.number().finite().min(0).max(360),
    saturation: hslChannelSchema,
    lightness: hslChannelSchema,
    harmony: z.enum(HARMONY_TYPES),
    lockedSwatches: z.array(lockedSwatchSchema).max(5).default([])
  })
  .strict()
  .superRefine(({ harmony, lockedSwatches }, context) => {
    const colorCount = HARMONY_COLOR_COUNTS[harmony];
    const seenIndexes = new Set<number>();

    for (const [position, lockedSwatch] of lockedSwatches.entries()) {
      if (lockedSwatch.index >= colorCount) {
        context.addIssue({
          code: 'custom',
          path: ['lockedSwatches', position, 'index'],
          message: 'Locked swatch index is not valid for this harmony'
        });
      }

      if (seenIndexes.has(lockedSwatch.index)) {
        context.addIssue({
          code: 'custom',
          path: ['lockedSwatches', position, 'index'],
          message: 'Each swatch can only be locked once'
        });
      }
      seenIndexes.add(lockedSwatch.index);
    }
  });

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

export type CreatePaletteInput = z.infer<typeof createPaletteSchema>;
export type ListPalettesQuery = z.infer<typeof listPalettesQuerySchema>;
