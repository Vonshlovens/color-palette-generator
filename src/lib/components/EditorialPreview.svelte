<script lang="ts">
  import type { UiRoles } from '$lib/color/roles';

  let { roles }: { roles: UiRoles } = $props();

  const mostRead = [
    'Why the river towns are painting their doors again',
    'A field guide to autumn larches',
    'The last letterpress shop on Ninth Avenue'
  ];
</script>

<div class="overflow-hidden rounded-2xl bg-(--p-canvas) px-5 py-6 text-(--p-ink) sm:px-9 sm:py-8">
  <header class="flex items-end justify-between gap-4 border-b-2 border-(--p-ink) pb-3">
    <span class="font-display text-3xl font-bold tracking-tight sm:text-4xl">Field Quarterly</span>
    <span class="hidden text-xs text-(--p-muted) sm:block">Issue 14, Autumn</span>
  </header>

  <div class="mt-7 grid gap-8 md:grid-cols-[1fr_14rem]">
    <article>
      <p class="text-sm font-semibold text-(--p-primary)">Craft</p>
      <h3 class="font-display mt-2 max-w-xl text-3xl leading-[1.05] font-semibold text-balance sm:text-[2.6rem]">
        The dyers who still mix every color by hand
      </h3>
      <p class="mt-3 text-sm text-(--p-muted)">By Mara Lindqvist, photographs by Teo Alvarez</p>

      <div class="mt-6 flex h-40 gap-1.5 overflow-hidden rounded-xl sm:h-52" aria-hidden="true">
        {#each roles.series as hex, index (index)}
          <span class="h-full" style="background: {hex}; flex-grow: {index === 0 ? 3 : 1}"></span>
        {/each}
      </div>

      <div class="mt-6 gap-6 text-[0.9375rem] leading-[1.7] md:columns-2">
        <p>
          In a converted creamery outside town, three generations of the Okafor family keep
          sixty jars of pigment on a single long shelf. Nothing is labeled. They know each one by
          the way it settles in water.
        </p>
        <blockquote class="my-5 border-l-4 border-(--p-accent) pl-4 font-display text-xl leading-snug font-medium break-inside-avoid">
          “A recipe gets you close. The weather decides the rest.”
        </blockquote>
        <p class="text-(--p-muted)">
          Orders arrive from studios in Kyoto and Lisbon, but the vats are still stirred with the
          same cedar paddles their grandmother carved in 1962.
        </p>
      </div>
    </article>

    <aside class="border-t border-(--p-line) pt-5 md:border-t-0 md:border-l md:pt-0 md:pl-6">
      <p class="font-display text-lg font-semibold">Most read</p>
      <ol class="mt-3 space-y-4">
        {#each mostRead as title, index (title)}
          <li class="flex gap-3">
            <span class="font-display text-2xl leading-none font-semibold text-(--p-accent)">{index + 1}</span>
            <span class="text-sm leading-snug">{title}</span>
          </li>
        {/each}
      </ol>
      <div class="mt-6 rounded-xl bg-(--p-secondary) p-4 text-(--p-on-secondary)">
        <p class="text-sm font-semibold">The Sunday letter</p>
        <p class="mt-1 text-xs opacity-85">One long read, every week.</p>
        <span class="mt-3 inline-block rounded-full bg-(--p-accent) px-3.5 py-1.5 text-xs font-semibold text-(--p-on-accent)">
          Subscribe
        </span>
      </div>
    </aside>
  </div>
</div>
