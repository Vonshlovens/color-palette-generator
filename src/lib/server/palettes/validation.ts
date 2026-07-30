import { z } from 'zod';
import { HARMONY_TYPES } from '$lib/types';

export const createPaletteSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(80, 'Name must be 80 characters or less'),
    hue: z.number().finite().min(0).max(360),
    saturation: z.number().finite().min(0).max(100),
    lightness: z.number().finite().min(0).max(100),
    harmony: z.enum(HARMONY_TYPES)
  })
  .strict();

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
