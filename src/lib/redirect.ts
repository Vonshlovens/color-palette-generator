/** Accepts only same-site paths such as `/palettes`, so sign-in redirects cannot leave the app. */
export function safeRedirectPath(value: string | null | undefined): string {
  return value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\')
    ? value
    : '/';
}
