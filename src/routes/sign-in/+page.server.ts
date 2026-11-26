import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { requestAccess } from '$lib/server/auth/access';
import { safeRedirectPath } from '$lib/redirect';
import type { Actions, PageServerLoad } from './$types';

const emailSchema = z.email('Enter a valid email address').max(254);
const requestAccessSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(80, 'Name must be 80 characters or less'),
  email: emailSchema
});

const LINK_ERRORS: Record<string, string> = {
  INVALID_TOKEN: 'That sign-in link is invalid, expired, or already used. Request a new one.',
  EXPIRED_TOKEN: 'That sign-in link expired. Request a new one.'
};

export const load: PageServerLoad = ({ locals, url }) => {
  const redirectTo = safeRedirectPath(url.searchParams.get('redirectTo'));
  if (locals.user) redirect(303, redirectTo);

  const error = url.searchParams.get('error');
  return {
    redirectTo,
    linkError: error
      ? (LINK_ERRORS[error] ?? 'That sign-in link can no longer be used. Your access may have changed.')
      : null
  };
};

export const actions: Actions = {
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
