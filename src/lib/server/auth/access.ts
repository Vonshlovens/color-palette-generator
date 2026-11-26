import { and, count, desc, eq, gt, ne } from 'drizzle-orm';
import type { AppDatabase } from '$lib/server/db';
import {
  session,
  user,
  verification,
  type ApprovalStatus,
  type UserRecord
} from '$lib/server/db/schema';

/** How long an address must wait between sign-in emails; bounds email and write volume. */
export const SIGN_IN_EMAIL_COOLDOWN_SECONDS = 60;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isOwnerEmail(email: string, ownerEmail: string): boolean {
  return normalizeEmail(email) === normalizeEmail(ownerEmail);
}

/** The owner (OWNER_EMAIL) always has access; everyone else needs an approved status. */
export function hasApprovedAccess(
  account: { email: string; approvalStatus?: string | null },
  ownerEmail: string
): boolean {
  return isOwnerEmail(account.email, ownerEmail) || account.approvalStatus === 'approved';
}

export async function findUserByEmail(
  db: AppDatabase,
  email: string
): Promise<UserRecord | undefined> {
  const [row] = await db
    .select()
    .from(user)
    .where(eq(user.email, normalizeEmail(email)))
    .limit(1);
  return row;
}

export async function findUserById(db: AppDatabase, id: string): Promise<UserRecord | undefined> {
  const [row] = await db.select().from(user).where(eq(user.id, id)).limit(1);
  return row;
}

/** Creates or re-approves the owner account so OWNER_EMAIL can always sign in. */
export async function ensureOwner(db: AppDatabase, ownerEmail: string): Promise<UserRecord> {
  const email = normalizeEmail(ownerEmail);
  const [owner] = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      name: email.split('@')[0],
      email,
      emailVerified: false,
      approvalStatus: 'approved'
    })
    .onConflictDoUpdate({ target: user.email, set: { approvalStatus: 'approved' } })
    .returning();
  return owner;
}

export type AccessRequestResult =
  | { outcome: 'created' }
  | { outcome: 'exists'; status: ApprovalStatus }
  | { outcome: 'closed' };

/**
 * Records a pending access request as an unapproved user. No email is sent and no session is
 * created; the total number of pending requests is capped so anonymous visitors cannot grow the
 * database without bound.
 */
export async function requestAccess(
  db: AppDatabase,
  input: { name: string; email: string },
  maxPendingRequests: number
): Promise<AccessRequestResult> {
  const email = normalizeEmail(input.email);
  const existing = await findUserByEmail(db, email);
  if (existing) return { outcome: 'exists', status: existing.approvalStatus };

  const [{ pending }] = await db
    .select({ pending: count() })
    .from(user)
    .where(eq(user.approvalStatus, 'pending'));
  if (pending >= maxPendingRequests) return { outcome: 'closed' };

  const [created] = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      name: input.name.trim(),
      email,
      emailVerified: false,
      approvalStatus: 'pending'
    })
    .onConflictDoNothing({ target: user.email })
    .returning({ id: user.id });

  if (created) return { outcome: 'created' };
  const raced = await findUserByEmail(db, email);
  return { outcome: 'exists', status: raced?.approvalStatus ?? 'pending' };
}

export async function listAccessUsers(db: AppDatabase): Promise<UserRecord[]> {
  return db.select().from(user).orderBy(desc(user.createdAt)).limit(500);
}

/**
 * Sets a user's approval status. Any status other than approved also signs the user out
 * everywhere by deleting their sessions. The owner's own status is never changed.
 */
export async function setApprovalStatus(
  db: AppDatabase,
  userId: string,
  status: ApprovalStatus,
  ownerEmail: string
): Promise<UserRecord | undefined> {
  const [updated] = await db
    .update(user)
    .set({ approvalStatus: status })
    .where(and(eq(user.id, userId), ne(user.email, normalizeEmail(ownerEmail))))
    .returning();

  if (updated && status !== 'approved') {
    await db.delete(session).where(eq(session.userId, userId));
  }
  return updated;
}

/**
 * Claims the per-address sign-in email slot. Returns false while an earlier email for the same
 * address is inside the cooldown window. Uses the Better Auth verification table, so it works the
 * same on D1, libSQL, and local SQLite.
 */
export async function claimSignInEmailSlot(
  db: AppDatabase,
  email: string,
  now = new Date()
): Promise<boolean> {
  const identifier = `sign-in-email-cooldown:${normalizeEmail(email)}`;
  const [active] = await db
    .select({ id: verification.id })
    .from(verification)
    .where(and(eq(verification.identifier, identifier), gt(verification.expiresAt, now)))
    .limit(1);
  if (active) return false;

  await db.delete(verification).where(eq(verification.identifier, identifier));
  await db.insert(verification).values({
    id: crypto.randomUUID(),
    identifier,
    value: '1',
    expiresAt: new Date(now.getTime() + SIGN_IN_EMAIL_COOLDOWN_SECONDS * 1000)
  });
  return true;
}
