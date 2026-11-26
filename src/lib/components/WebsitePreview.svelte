<script lang="ts">
  import type { UiRoles } from '$lib/color/roles';

  let { roles }: { roles: UiRoles } = $props();

  const products = [
    { name: 'Waxed canvas daypack', price: '$148', tag: 'Restocked' },
    { name: 'Merino quarter-zip', price: '$96', tag: 'New' },
    { name: 'Field repair kit', price: '$32', tag: 'Staff pick' }
  ];
</script>

<div class="overflow-hidden rounded-2xl bg-(--p-canvas) text-(--p-ink)">
  <header class="flex items-center justify-between gap-4 bg-(--p-secondary) px-5 py-3.5 text-(--p-on-secondary) sm:px-8">
    <span class="font-display flex items-center gap-2 text-base font-semibold">
      <span class="size-5 rounded-md bg-(--p-accent)"></span>
      Larch Outfitters
    </span>
    <nav class="hidden items-center gap-6 text-sm opacity-85 md:flex" aria-label="Preview navigation">
      <span>Shop</span><span>Trips</span><span>Repairs</span><span>Journal</span>
    </nav>
    <span class="rounded-full bg-(--p-accent) px-3.5 py-1.5 text-xs font-semibold text-(--p-on-accent)">
      Cart (2)
    </span>
  </header>

  <div class="grid items-center gap-8 px-5 py-9 sm:px-8 md:grid-cols-[1.25fr_1fr] md:py-12">
    <div>
      <p class="text-sm font-medium text-(--p-muted)">The autumn field kit</p>
      <h3 class="font-display mt-2 text-4xl leading-[1.02] font-semibold text-balance sm:text-5xl">
        Gear for the long way round.
      </h3>
      <p class="mt-4 max-w-sm text-[0.9375rem] leading-relaxed text-(--p-muted)">
        Waxed canvas packs, merino layers, and free repairs for life. Made in small runs near the
        Bow River.
      </p>
      <div class="mt-6 flex flex-wrap gap-2.5">
        <span class="rounded-full bg-(--p-accent) px-5 py-2.5 text-sm font-semibold text-(--p-on-accent) shadow-sm">
          Shop the kit
        </span>
        <span class="rounded-full border-2 border-(--p-secondary) px-5 py-2 text-sm font-semibold">
          Book a repair
        </span>
      </div>
    </div>
    <div class="grid aspect-[5/4] grid-cols-5 grid-rows-4 gap-2" aria-hidden="true">
      <span class="col-span-3 row-span-4 rounded-2xl bg-(--p-primary)"></span>
      <span class="col-span-2 row-span-2 rounded-2xl bg-(--p-surface) shadow-sm"></span>
      <span class="col-span-2 row-span-2 rounded-2xl bg-(--p-accent)"></span>
    </div>
  </div>

  <div class="grid gap-3 px-5 pb-8 sm:grid-cols-3 sm:px-8">
    {#each products as product, index (product.name)}
      <article class="rounded-xl bg-(--p-surface) p-3 shadow-[0_1px_2px_rgb(0_0_0/0.08)]">
        <div
          class="relative mb-3 aspect-[4/3] rounded-lg"
          style="background: {[roles.primary, roles.secondary, roles.accent][index]}"
        >
          <span class="absolute top-2 left-2 rounded-full bg-(--p-surface) px-2 py-0.5 text-[10px] font-semibold text-(--p-ink)">
            {product.tag}
          </span>
        </div>
        <p class="text-sm font-medium">{product.name}</p>
        <p class="mt-0.5 text-sm text-(--p-muted)">{product.price}</p>
      </article>
    {/each}
  </div>

  <footer class="flex flex-wrap items-center justify-between gap-3 bg-(--p-secondary) px-5 py-4 text-xs text-(--p-on-secondary) sm:px-8">
    <span class="opacity-80">Repairs are free for as long as you own the gear.</span>
    <span class="font-semibold">Join the trip list</span>
  </footer>
</div>
