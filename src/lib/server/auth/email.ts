export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export type SendEmail = (message: EmailMessage) => Promise<void>;

export interface EmailEnv {
  RESEND_API_KEY?: string;
  AUTH_EMAIL_FROM?: string;
}

/**
 * Sends email through the Resend HTTP API with `fetch`, so it runs unchanged on Cloudflare Workers
 * and in tests. Without RESEND_API_KEY, local runs (`logToConsole`) print the message, including any
 * sign-in link, to the console; deployments refuse to send so a missing key is never ignored.
 */
export function createEmailSender(env: EmailEnv, logToConsole: boolean): SendEmail {
  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.AUTH_EMAIL_FROM?.trim();

  if (!apiKey) {
    return async (message) => {
      if (!logToConsole) {
        throw new Error('Email delivery is not configured: set RESEND_API_KEY and AUTH_EMAIL_FROM');
      }
      console.info(`[auth] Email to ${message.to}: ${message.subject}\n${message.text}`);
    };
  }

  return async (message) => {
    if (!from) throw new Error('AUTH_EMAIL_FROM must be set when RESEND_API_KEY is configured');

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html
      })
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Resend rejected the email (${response.status}): ${detail.slice(0, 200)}`);
    }
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function linkEmail(to: string, subject: string, intro: string, label: string, url: string, outro: string): EmailMessage {
  return {
    to,
    subject,
    text: `${intro}\n\n${url}\n\n${outro}`,
    html: `<p>${escapeHtml(intro)}</p><p><a href="${escapeHtml(url)}">${escapeHtml(label)}</a></p><p style="color:#666">${escapeHtml(outro)}</p>`
  };
}

export function magicLinkEmail(to: string, url: string, expiresInMinutes: number): EmailMessage {
  return linkEmail(
    to,
    'Your Palette Studio sign-in link',
    'Use this link to sign in to Palette Studio:',
    'Sign in to Palette Studio',
    url,
    `The link expires in ${expiresInMinutes} minutes and works once. If you did not request it, ignore this email.`
  );
}

export function accessApprovedEmail(to: string, signInUrl: string): EmailMessage {
  return linkEmail(
    to,
    'Your Palette Studio access was approved',
    'Your request to use Palette Studio was approved. Sign in with this email address to save palettes:',
    'Sign in to Palette Studio',
    signInUrl,
    'You will receive a one-time sign-in link when you sign in.'
  );
}
