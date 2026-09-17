<script lang="ts">
  import { generateSnapshotPalette, getHarmonyName } from '$lib/color/harmonies';
  import type { HarmonyType, LockedSwatch } from '$lib/types';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import Check from '@lucide/svelte/icons/check';
  import Link2 from '@lucide/svelte/icons/link-2';
  import Pencil from '@lucide/svelte/icons/pencil';

  interface Props {
    slug: string;
    name: string;
    hue: number;
    saturation: number;
    lightness: number;
    harmony: HarmonyType;
    lockedSwatches?: readonly LockedSwatch[];
    /** Pre-formatted date line, e.g. "Created 2026-07-28". */
    dateLabel: string;
  }

  let { slug, name, hue, saturation, lightness, harmony, lockedSwatches, dateLabel }: Props = $props();

  const colors = $derived(
    generateSnapshotPalette({ hue, saturation, lightness, harmony, lockedSwatches })
  );
  let copied = $state(false);

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(`${location.origin}/palettes/${slug}`);
      copied = true;
      setTimeout(() => (copied = false), 1500);
    } catch (error) {
      console.error('Failed to copy share link:', error);
    }
  }
</script>

<Card.Root size="sm" class="pt-0">
  <div class="flex h-16" role="img" aria-label="Preview of {name}">
    {#each colors as color, index (index)}
      <span class="flex-1" style="background-color: {color.hex}" title={color.hex}></span>
    {/each}
  </div>

  <Card.Header>
    <Card.Title class="truncate" title={name}>{name}</Card.Title>
    <Card.Description>{dateLabel}</Card.Description>
    <Card.Action>
      <Badge variant="outline">{getHarmonyName(harmony)}</Badge>
    </Card.Action>
  </Card.Header>

  <Card.Footer class="flex-wrap gap-2">
    <Button size="sm" href="/palettes/{slug}">
      <Pencil data-icon="inline-start" />
      Open & edit
    </Button>
    <Button size="sm" variant="outline" onclick={copyShareLink}>
      {#if copied}
        <Check data-icon="inline-start" />
        Copied
      {:else}
        <Link2 data-icon="inline-start" />
        Copy link
      {/if}
    </Button>
  </Card.Footer>

  <p class="sr-only" aria-live="polite">{copied ? 'Share link copied' : ''}</p>
</Card.Root>
