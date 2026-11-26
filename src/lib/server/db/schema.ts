import { sql } from 'drizzle-orm';
import { check, index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { HARMONY_TYPES, type HarmonyType } from '$lib/types';

const createdAt = () =>
  integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`);

const updatedAt = () =>
  integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`)
    .$onUpdate(() => new Date());

export const APPROVAL_STATUSES = ['pending', 'approved', 'rejected', 'revoked'] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

// Better Auth core tables (user, session, account, verification), plus the owner-approval status.
export const user = sqliteTable(
  'user',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
    image: text('image'),
    approvalStatus: text('approval_status', { enum: APPROVAL_STATUSES })
      .$type<ApprovalStatus>()
      .notNull()
      .default('pending'),
    createdAt: createdAt(),
    updatedAt: updatedAt()
  },
  (table) => [
    uniqueIndex('user_email_unique').on(table.email),
    index('user_approval_status_idx').on(table.approvalStatus),
    check(
      'user_approval_status_check',
      sql`${table.approvalStatus} in ('pending', 'approved', 'rejected', 'revoked')`
    )
  ]
);

export const session = sqliteTable(
  'session',
  {
    id: text('id').primaryKey(),
    token: text('token').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
    updatedAt: updatedAt()
  },
  (table) => [
    uniqueIndex('session_token_unique').on(table.token),
    index('session_user_id_idx').on(table.userId)
  ]
);

export const account = sqliteTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp_ms' }),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp_ms' }),
    scope: text('scope'),
    password: text('password'),
    createdAt: createdAt(),
    updatedAt: updatedAt()
  },
  (table) => [index('account_user_id_idx').on(table.userId)]
);

export const verification = sqliteTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt()
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)]
);

export const palettes = sqliteTable(
  'palettes',
  {
    id: text('id').primaryKey().notNull(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    hue: real('hue').notNull(),
    saturation: real('saturation').notNull(),
    lightness: real('lightness').notNull(),
    harmony: text('harmony', { enum: HARMONY_TYPES }).$type<HarmonyType>().notNull(),
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
      sql`${table.harmony} in ('complementary', 'analogous', 'triadic', 'split-complementary', 'tetradic', 'monochromatic', '60-30-10')`
    )
  ]
);

export type PaletteRecord = typeof palettes.$inferSelect;
export type NewPaletteRecord = typeof palettes.$inferInsert;
export type UserRecord = typeof user.$inferSelect;
