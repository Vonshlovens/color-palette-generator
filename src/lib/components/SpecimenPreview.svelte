<script lang="ts">
  import type { UiRoles } from '$lib/color/roles';

  let { roles }: { roles: UiRoles } = $props();

  const scale = [
    { name: 'Display', size: 'text-5xl', weight: 'font-semibold', family: 'font-display', sample: 'Quiet color' },
    { name: 'Heading', size: 'text-3xl', weight: 'font-semibold', family: 'font-display', sample: 'Built to be read' },
    { name: 'Title', size: 'text-xl', weight: 'font-medium', family: 'font-sans', sample: 'Settings and preferences' },
    { name: 'Body', size: 'text-base', weight: 'font-normal', family: 'font-sans', sample: 'The quick brown fox jumps over the lazy dog.' },
    { name: 'Caption', size: 'text-xs', weight: 'font-normal', family: 'font-sans', sample: 'Updated 4 minutes ago' }
  ];
</script>

<div class="grid gap-px overflow-hidden rounded-2xl bg-(--p-line) lg:grid-cols-[1.2fr_1fr]">
  <div class="bg-(--p-canvas) p-5 text-(--p-ink) sm:p-7">
    <ul class="space-y-4">
      {#each scale as step (step.name)}
        <li class="grid grid-cols-[4.5rem_1fr] items-baseline gap-3">
          <span class="text-xs text-(--p-muted)">{step.name}</span>
          <span class="{step.size} {step.weight} {step.family} truncate leading-tight">{step.sample}</span>
        </li>
      {/each}
    </ul>
    <p class="mt-6 max-w-md border-t border-(--p-line) pt-4 text-sm leading-relaxed text-(--p-muted)">
      Body copy sits on the canvas in the ink color. Links use
      <span class="font-medium text-(--p-primary) underline underline-offset-2">the primary role</span>,
      and highlights use
      <mark class="rounded bg-(--p-accent) px-1 text-(--p-on-accent)">the accent</mark>.
    </p>
  </div>

  <div class="space-y-5 bg-(--p-surface) p-5 text-(--p-ink) sm:p-7">
    <div class="flex flex-wrap gap-2">
      <span class="rounded-lg bg-(--p-primary) px-4 py-2 text-sm font-semibold text-(--p-on-primary)">Primary</span>
      <span class="rounded-lg bg-(--p-secondary) px-4 py-2 text-sm font-semibold text-(--p-on-secondary)">Secondary</span>
      <span class="rounded-lg border border-(--p-line) px-4 py-2 text-sm font-semibold">Outline</span>
      <span class="rounded-lg px-4 py-2 text-sm font-semibold text-(--p-primary)">Ghost</span>
    </div>

    <div class="flex flex-wrap gap-1.5">
      {#each roles.series as hex, index (index)}
        <span
          class="rounded-full px-2.5 py-0.5 text-xs font-medium"
          style="background: color-mix(in oklab, {hex} 20%, transparent); box-shadow: inset 0 0 0 1px color-mix(in oklab, {hex} 45%, transparent)"
        >
          Label {index + 1}
        </span>
      {/each}
    </div>

    <div>
      <span class="text-xs font-medium">Email address</span>
      <div class="mt-1.5 rounded-lg border-2 border-(--p-primary) bg-(--p-canvas) px-3 py-2 text-sm shadow-[0_0_0_4px_color-mix(in_oklab,var(--p-primary)_22%,transparent)]">
        mara@fieldquarterly.com
      </div>
    </div>

    <div class="flex items-center gap-3 text-sm">
      <span class="relative h-6 w-11 rounded-full bg-(--p-primary)">
        <span class="absolute top-0.5 right-0.5 size-5 rounded-full bg-white shadow"></span>
      </span>
      Weekly digest
      <span class="relative ml-auto h-6 w-11 rounded-full bg-(--p-line)">
        <span class="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow"></span>
      </span>
    </div>

    <div class="flex gap-3 rounded-xl p-3.5 text-sm" style="background: color-mix(in oklab, {roles.accent} 16%, transparent)">
      <span class="mt-0.5 size-2 shrink-0 rounded-full bg-(--p-accent)"></span>
      <span><span class="font-semibold">Storage almost full.</span> Archive old projects to free 2.4 GB.</span>
    </div>

    <div>
      <div class="flex justify-between text-xs text-(--p-muted)"><span>Upload</span><span class="tabular">68%</span></div>
      <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-(--p-line)">
        <div class="h-full w-[68%] rounded-full bg-(--p-primary)"></div>
      </div>
    </div>
  </div>
</div>
