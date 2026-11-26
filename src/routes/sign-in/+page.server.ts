import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { OAUTH_ACCESS_ERRORS } from '$lib/server/auth';
import { requestAccess } from '$lib/server/auth/access';
import { safeRedirectPath } from '$lib/redirect';
import type { Actions, PageServerLoad } from './$types';

const emailSchema = z.email('Enter a valid email address').max(254);
const requestAccessSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(80, 'Name must be 80 characters or less'),
  email: emailSchema
});

const SIGN_IN_ERRORS: Record<string, string> = {
  INVALID_TOKEN: 'That sign-in link is invalid, expired, or already used. Request a new one.',
  EXPIRED_TOKEN: 'That sign-in link expired. Request a new one.',
  [OAUTH_ACCESS_ERRORS.denied]: 'That account does not have access to Palette Studio.',
  [OAUTH_ACCESS_ERRORS.closed]:
    'Access requests are paused right now, so your GitHub sign-in was not recorded. Try again later.',
  [OAUTH_ACCESS_ERRORS.emailUnverified]:
    'GitHub has not verified the email on that account. Verify it on GitHub, or use an email link.',
  account_not_linked:
    'An account already uses that email, but GitHub has not verified it. Sign in with an email link, then connect GitHub from your account page.',
  access_denied: 'GitHub sign-in was cancelled.',
  email_not_found: 'GitHub did not share an email address. Use an email link instead.',
  state_mismatch: 'That GitHub sign-in expired or started in another browser. Try again.',
  state_not_found: 'That GitHub sign-in expired or started in another browser. Try again.'
};

export const load: PageServerLoad = ({ locals, url }) => {
  const redirectTo = safeRedirectPath(url.searchParams.get('redirectTo'));
  if (locals.user) redirect(303, redirectTo);

  const error = url.searchParams.get('error');
  const accessRequested = error === OAUTH_ACCESS_ERRORS.pending;
  return {
    redirectTo,
    githubEnabled: locals.authConfig.github !== null,
    // A GitHub sign-in that is (now) an access request waiting for the owner.
    accessRequested,
    linkError:
      error && !accessRequested
        ? (SIGN_IN_ERRORS[error] ?? 'That sign-in could not be completed. Your access may have changed.')
        : null
  };
};

export const actions: Actions = {
  github: async ({ locals, request }) => {
    if (!locals.authConfig.github) return fail(404, { form: 'github' as const, error: 'GitHub sign-in is not available.' });
    const redirectTo = safeRedirectPath(String((await request.formData()).get('redirectTo') ?? '/'));

    let url: string | undefined;
    try {
      ({ url } = await locals.auth.api.signInSocial({
        body: {
          provider: 'github',
          callbackURL: redirectTo,
          errorCallbackURL: `/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`
        },
        headers: request.headers
      }));
    } catch (cause) {
      console.error('Failed to start GitHub sign-in', cause);
    }
    if (!url) {
      return fail(503, { form: 'github' as const, error: 'GitHub sign-in is unavailable right now. Try again.' });
    }
    // The OAuth state cookie was set on this response by the sveltekitCookies plugin.
    redirect(303, url);
  },

  signIn: async ({ locals, request }) => {
    const form = await request.formData();
    const email = String(form.get('email') ?? '').trim();
    const redirectTo = safeRedirectPath(String(form.get('redirectTo') ?? '/'));

    if (!emailSchema.safeParse(email).success) {
      return fail(400, { form: 'signIn' as const, email, error: 'Enter a valid email address.' });
    }

    try {
      await locals.auth.api.signInMagicLink({
        body: { email, callbackURL: redirectTo, errorCallbackURL: '/sign-in' },
        headers: request.headers
      });
    } catch (cause) {
      console.error('Failed to send a sign-in link', cause);
      return fail(503, {
        form: 'signIn' as const,
        email,
        error: 'We could not send a sign-in link right now. Try again in a minute.'
      });
    }

    return { form: 'signIn' as const, email, sent: true };
  },

  requestAccess: async ({ locals, request }) => {
    const form = await request.formData();
    const name = String(form.get('name') ?? '');
    const email = String(form.get('email') ?? '').trim();
    const parsed = requestAccessSchema.safeParse({ name, email });

    if (!parsed.success) {
      return fail(400, {
        form: 'requestAccess' as const,
        name,
        email,
        error: parsed.error.issues[0]?.message ?? 'Check the form and try again.'
      });
    }

    try {
      const result = await requestAccess(locals.db, parsed.data, locals.authConfig.maxPendingRequests);
      if (result.outcome === 'closed') {
        return fail(429, {
          form: 'requestAccess' as const,
          name,
          email,
          error: 'Access requests are paused right now. Try again later.'
        });
      }
    } catch (cause) {
      console.error('Failed to record an access request', cause);
      return fail(503, {
        form: 'requestAccess' as const,
        name,
        email,
        error: 'We could not record your request right now. Try again later.'
      });
    }

    // The same answer for new and existing emails, so the form does not reveal who has access.
    return { form: 'requestAccess' as const, email, requested: true };
  }
};
