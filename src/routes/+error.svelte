<script lang="ts">
  import { page } from '$app/state';
  import AlertTriangle from '@lucide/svelte/icons/triangle-alert';
  import { Button } from '$lib/components/ui/button';
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
  } from '$lib/components/ui/card';

  const title = $derived(page.status === 404 ? 'Page not found' : 'Something went wrong');
  const description = $derived(
    page.status === 404
      ? 'The palette or page you requested may have moved or no longer exists.'
      : 'The request could not be completed. Try again, or return to the palette generator.'
  );
</script>

<svelte:head>
  <title>{page.status} · {title} · Palette Studio</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center px-4 py-12">
  <Card class="w-full max-w-lg">
    <CardHeader>
      <div class="bg-destructive/10 text-destructive mb-2 flex size-11 items-center justify-center rounded-xl">
        <AlertTriangle class="size-5" aria-hidden="true" />
      </div>
      <p class="text-muted-foreground font-mono text-sm">Error {page.status}</p>
      <CardTitle class="text-2xl">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <p class="text-muted-foreground text-sm" role="status">
        {page.error?.message ?? 'An unexpected error occurred.'}
      </p>
    </CardContent>
    <CardFooter class="flex flex-wrap gap-2">
      <Button href="/">Return home</Button>
      <Button variant="outline" onclick={() => window.location.reload()}>Try again</Button>
    </CardFooter>
  </Card>
</main>
