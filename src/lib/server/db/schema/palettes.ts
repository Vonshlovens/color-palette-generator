import { sql } from 'drizzle-orm';
import { check, index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { PALETTE_KINDS, type HSL, type PaletteKind } from '$lib/types';
import { user } from './auth';

export const palettes = sqliteTable(
  'palettes',
  {
    id: text('id').primaryKey().notNull(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    hue: real('hue').notNull(),
    saturation: real('saturation').notNull(),
    lightness: real('lightness').notNull(),
    harmony: text('harmony', { enum: PALETTE_KINDS }).$type<PaletteKind>().notNull(),
    /**
     * The exact swatches as a JSON array of HSL objects. Null on rows saved before this column
     * existed; those are derived from hue/saturation/lightness/harmony when read.
     */
    colors: text('colors', { mode: 'json' }).$type<HSL[]>(),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`)
  },
  (table) => [
    uniqueIndex('palettes_slug_unique').on(table.slug),
    index('palettes_created_at_idx').on(table.createdAt),
    check('palettes_slug_length_check', sql`length(${table.slug}) between 8 and 32`),
    check('palettes_name_length_check', sql`length(trim(${table.name})) between 1 and 80`),
    check('palettes_hue_check', sql`${table.hue} between 0 and 360`),
    check('palettes_saturation_check', sql`${table.saturation} between 0 and 100`),
    check('palettes_lightness_check', sql`${table.lightness} between 0 and 100`),
    check(
      'palettes_harmony_check',
      sql`${table.harmony} in ('complementary', 'analogous', 'triadic', 'split-complementary', 'tetradic', 'monochromatic', '60-30-10', 'freeform')`
    ),
    check(
      'palettes_colors_check',
      sql`${table.colors} is null or (json_valid(${table.colors}) and json_type(${table.colors}) = 'array' and json_array_length(${table.colors}) between 1 and 7)`
    ),
    check(
      'palettes_freeform_colors_check',
      sql`${table.harmony} <> 'freeform' or ${table.colors} is not null`
    )
  ]
);

export type PaletteRecord = typeof palettes.$inferSelect;
export type NewPaletteRecord = typeof palettes.$inferInsert;
