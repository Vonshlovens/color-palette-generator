import { fail, redirect } from '@sveltejs/kit';
import { isAPIError } from 'better-auth/api';
import { listLinkedAccounts } from '$lib/server/auth/access';
import type { Actions, PageServerLoad } from './$types';

const CONNECT_ERRORS: Record<string, string> = {
  account_already_linked_to_different_user:
    'That GitHub login already belongs to another Palette Studio account, usually one made by choosing Continue with GitHub before connecting it here. The owner can remove that pending account in Approvals; then try again.',
  unable_to_link_account:
    'GitHub has not verified the email on that account. Verify it on GitHub, then try again.',
  access_denied: 'GitHub connection was cancelled.',
  state_mismatch: 'That GitHub connection expired or started in another browser. Try again.',
  state_not_found: 'That GitHub connection expired or started in another browser. Try again.'
};

function requireUser(locals: App.Locals) {
  if (!locals.user) redirect(303, '/sign-in?redirectTo=%2Faccount');
  return locals.user;
}

async function findGitHubAccount(locals: App.Locals, userId: string) {
  return (await listLinkedAccounts(locals.db, userId)).find((row) => row.providerId === 'github');
}

export const load: PageServerLoad = async ({ locals, url }) => {
  const user = requireUser(locals);
  const github = await findGitHubAccount(locals, user.id);
  const error = url.searchParams.get('error');

  return {
    githubEnabled: locals.authConfig.github !== null,
    github: github ? { connectedAt: github.createdAt.toISOString() } : null,
    justConnected: url.searchParams.get('connected') === 'github' && github !== undefined,
    connectError: error
      ? (CONNECT_ERRORS[error] ?? 'GitHub could not be connected. Try again.')
      : null
  };
};

export const actions: Actions = {
  connectGitHub: async ({ locals, request }) => {
    requireUser(locals);
    if (!locals.authConfig.github) return fail(404, { error: 'GitHub sign-in is not available.' });

    let url: string | undefined;
    try {
      ({ url } = await locals.auth.api.linkSocialAccount({
        body: {
          provider: 'github',
          callbackURL: '/account?connected=github',
          errorCallbackURL: '/account'
        },
        headers: request.headers
      }));
    } catch (cause) {
      console.error('Failed to start linking GitHub', cause);
    }
    if (!url) return fail(503, { error: 'GitHub is unavailable right now. Try again.' });
    redirect(303, url);
  },

  disconnectGitHub: async ({ locals, request }) => {
    const user = requireUser(locals);
    const github = await findGitHubAccount(locals, user.id);
    if (!github) return { disconnected: true };

    try {
      await locals.auth.api.unlinkAccount({ body: { accountId: github.id }, headers: request.headers });
    } catch (cause) {
      if (isAPIError(cause) && cause.body?.code === 'SESSION_NOT_FRESH') {
        return fail(403, {
          error: 'For safety, disconnecting needs a recent sign-in. Sign out, sign back in, and try again.'
        });
      }
      console.error('Failed to unlink GitHub', cause);
      return fail(503, { error: 'GitHub could not be disconnected. Try again.' });
    }
    return { disconnected: true };
  }
};
