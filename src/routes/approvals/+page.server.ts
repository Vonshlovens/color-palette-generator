import { error, fail, redirect } from '@sveltejs/kit';
import {
  isOwnerEmail,
  listAccessUsers,
  listGitHubUserIds,
  removeUnapprovedUser,
  setApprovalStatus
} from '$lib/server/auth/access';
import { accessApprovedEmail, createEmailSender } from '$lib/server/auth/email';
import type { ApprovalStatus } from '$lib/server/db/schema';
import type { Actions, PageServerLoad, RequestEvent } from './$types';

function requireOwner(locals: App.Locals, url: URL) {
  if (!locals.user) redirect(303, `/sign-in?redirectTo=${encodeURIComponent(url.pathname)}`);
  if (!locals.user.isOwner) error(403, 'Only the owner can manage access');
  return locals.user;
}

export const load: PageServerLoad = async ({ locals, url }) => {
  requireOwner(locals, url);
  const [users, githubUserIds] = await Promise.all([
    listAccessUsers(locals.db),
    listGitHubUserIds(locals.db)
  ]);

  return {
    users: users.map((account) => ({
      id: account.id,
      name: account.name,
      email: account.email,
      status: account.approvalStatus,
      isOwner: isOwnerEmail(account.email, locals.authConfig.ownerEmail),
      hasGitHub: githubUserIds.has(account.id),
      requestedAt: account.createdAt.toISOString()
    }))
  };
};

function statusAction(status: ApprovalStatus) {
  return async ({ locals, request, url }: RequestEvent) => {
    requireOwner(locals, url);
    const userId = String((await request.formData()).get('userId') ?? '');

    const updated = await setApprovalStatus(locals.db, userId, status, locals.authConfig.ownerEmail);
    if (!updated) return fail(404, { error: 'That user no longer exists or is the owner.' });

    if (status === 'approved') {
      const sendEmail = createEmailSender(locals.authConfig.email, locals.authConfig.logEmails);
      const signInUrl = new URL('/sign-in', locals.authConfig.baseURL).toString();
      // The approval stands even if the notification email fails.
      await sendEmail(accessApprovedEmail(updated.email, signInUrl)).catch((cause) =>
        console.error('Failed to send the access approved email', cause)
      );
    }
    return { updated: { email: updated.email, status } };
  };
}

export const actions: Actions = {
  approve: statusAction('approved'),
  reject: statusAction('rejected'),
  revoke: statusAction('revoked'),
  remove: async ({ locals, request, url }) => {
    requireOwner(locals, url);
    const userId = String((await request.formData()).get('userId') ?? '');
    const removed = await removeUnapprovedUser(locals.db, userId, locals.authConfig.ownerEmail);
    if (!removed) return fail(404, { error: 'Only pending or rejected accounts can be removed.' });
    return { removed: { email: removed.email } };
  }
};
