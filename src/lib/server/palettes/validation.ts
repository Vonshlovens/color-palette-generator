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

export type CreatePaletteInput = z.infer<typeof createPaletteSchema>;
