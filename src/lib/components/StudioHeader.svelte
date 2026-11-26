<script lang="ts">
  import { page } from '$app/state';
  import type { Snippet } from 'svelte';
  import ThemeControl from './ThemeControl.svelte';

  interface Props {
    /** Extra page actions shown before the theme control. */
    actions?: Snippet;
  }

  let { actions }: Props = $props();

  const links = [
    { href: '/', label: 'Studio' },
    { href: '/palettes', label: 'Gallery' }
  ];

  const isActive = (href: string) =>
    href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
</script>

<header
  class="bg-background/75 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b backdrop-blur-xl backdrop-saturate-150"
>
  <div class="mx-auto flex h-14 max-w-[90rem] items-center gap-3 px-4 sm:gap-6 sm:px-6">
    <a href="/" class="group flex shrink-0 items-center gap-2.5" aria-label="Palette Studio home">
      <!-- The mark is a wheel quadrant painted with the live accent. -->
      <span
        class="relative grid size-8 place-items-center overflow-hidden rounded-[10px] shadow-[inset_0_1px_0_oklch(1_0_0/0.35),0_1px_2px_oklch(0_0_0/0.2)] transition-transform duration-300 group-hover:rotate-[-8deg]"
        style="background: conic-gradient(from 200deg, var(--ambient-b), var(--studio-accent), var(--ambient-a), var(--ambient-b));"
        aria-hidden="true"
      >
        <span class="bg-background/90 size-3 rounded-full shadow-inner"></span>
      </span>
      <span class="font-display text-[1.05rem] font-semibold">Palette Studio</span>
    </a>

    <nav aria-label="Primary" class="segmented hidden sm:inline-flex">
      {#each links as link}
        <a href={link.href} aria-current={isActive(link.href) ? 'page' : undefined}>
          {link.label}
        </a>
      {/each}
    </nav>

    <div class="ml-auto flex items-center gap-2">
      {@render actions?.()}
      <a
        href={isActive('/palettes') ? '/' : '/palettes'}
        class="text-muted-foreground hover:text-foreground text-sm font-medium sm:hidden"
      >
        {isActive('/palettes') ? 'Studio' : 'Gallery'}
      </a>
      <ThemeControl />
    </div>
  </div>
</header>
