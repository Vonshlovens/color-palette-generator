<script lang="ts">
  import type { HarmonyType } from '$lib/types';
  import { paletteStore } from '$lib/stores/palette.svelte';
  import { getHarmonyName, getHarmonyDescription } from '$lib/color/harmonies';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import CircleDot from '@lucide/svelte/icons/circle-dot';
  import GitFork from '@lucide/svelte/icons/git-fork';
  import Orbit from '@lucide/svelte/icons/orbit';
  import RectangleHorizontal from '@lucide/svelte/icons/rectangle-horizontal';
  import Split from '@lucide/svelte/icons/split';
  import Triangle from '@lucide/svelte/icons/triangle';

  const harmonies = [
    { type: 'complementary', icon: CircleDot },
    { type: 'analogous', icon: Orbit },
    { type: 'triadic', icon: Triangle },
    { type: 'split-complementary', icon: Split },
    { type: 'tetradic', icon: RectangleHorizontal },
    { type: 'monochromatic', icon: GitFork }
  ] satisfies { type: HarmonyType; icon: typeof CircleDot }[];

  function handleKeyboard(event: KeyboardEvent) {
    if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(event.key)) return;

    event.preventDefault();
    const currentIndex = harmonies.findIndex(({ type }) => type === paletteStore.harmony);
    const direction = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (currentIndex + direction + harmonies.length) % harmonies.length;
    paletteStore.setHarmony(harmonies[nextIndex].type);

    const options = (event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="radio"]');
    options[nextIndex]?.focus();
  }
</script>

<Card.Root>
  <Card.Header class="border-b">
    <Card.Title>Harmony</Card.Title>
    <Card.Description>Choose how colors relate on the color wheel.</Card.Description>
  </Card.Header>
  <Card.Content>
    <Tooltip.Provider delayDuration={300}>
      <div
        class="grid gap-2 sm:grid-cols-2 lg:grid-cols-1"
        role="radiogroup"
        aria-label="Color harmony"
        tabindex="-1"
        onkeydown={handleKeyboard}
      >
        {#each harmonies as harmony}
          {@const Icon = harmony.icon}
          <Tooltip.Root>
            <Tooltip.Trigger>
              {#snippet child({ props })}
                <Button
                  {...props}
                  variant={paletteStore.harmony === harmony.type ? 'secondary' : 'ghost'}
                  class={`h-auto w-full justify-start px-3 py-2.5 text-left whitespace-normal ${
                    paletteStore.harmony === harmony.type
                      ? 'ring-2 ring-[var(--workspace-accent)]'
                      : ''
                  }`}
                  role="radio"
                  aria-checked={paletteStore.harmony === harmony.type}
                  tabindex={paletteStore.harmony === harmony.type ? 0 : -1}
                  onclick={() => paletteStore.setHarmony(harmony.type)}
                >
                  <Icon class="size-4 shrink-0" aria-hidden="true" />
                  <span class="min-w-0">
                    <span class="block leading-none">{getHarmonyName(harmony.type)}</span>
                    <span class="text-muted-foreground mt-1 block text-xs font-normal">
                      {getHarmonyDescription(harmony.type)}
                    </span>
                  </span>
                </Button>
              {/snippet}
            </Tooltip.Trigger>
            <Tooltip.Content side="right">{getHarmonyDescription(harmony.type)}</Tooltip.Content>
          </Tooltip.Root>
        {/each}
      </div>
    </Tooltip.Provider>
  </Card.Content>
</Card.Root>
