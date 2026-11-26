<script lang="ts">
  import type { UiRoles } from '$lib/color/roles';

  let { roles }: { roles: UiRoles } = $props();

  const nav = ['Overview', 'Projects', 'Invoices', 'Clients', 'Settings'];
  const kpis = [
    { label: 'Monthly revenue', value: '$48,210', delta: '+12.4%' },
    { label: 'Active clients', value: '312', delta: '+8' },
    { label: 'Avg. response', value: '1h 42m', delta: '−18m' }
  ];
  const bars = [42, 58, 51, 67, 73, 61, 80, 76, 88, 70, 92, 85];
  const line = [30, 34, 31, 42, 40, 48, 55, 52, 61, 66, 63, 74];
  const rows = [
    { client: 'Northwind Studio', amount: '$4,200', status: 'Paid' },
    { client: 'Tidewell Co-op', amount: '$1,850', status: 'Pending' },
    { client: 'Okafor Dyeworks', amount: '$3,075', status: 'Paid' }
  ];

  const path = line
    .map((value, index) => `${index === 0 ? 'M' : 'L'}${(index / (line.length - 1)) * 300} ${100 - value}`)
    .join(' ');
</script>

<div class="grid overflow-hidden rounded-2xl bg-(--p-canvas) text-(--p-ink) md:grid-cols-[11rem_1fr]">
  <aside class="hidden border-r border-(--p-line) bg-(--p-surface) p-4 md:block">
    <p class="font-display flex items-center gap-2 text-base font-semibold">
      <span class="size-5 rounded-md bg-(--p-primary)"></span>
      Ledgerly
    </p>
    <ul class="mt-6 space-y-1 text-sm">
      {#each nav as item, index (item)}
        <li
          class="rounded-lg px-2.5 py-1.5 {index === 0
            ? 'bg-(--p-primary) font-medium text-(--p-on-primary)'
            : 'text-(--p-muted)'}"
        >
          {item}
        </li>
      {/each}
    </ul>
  </aside>

  <div class="min-w-0 space-y-4 p-4 sm:p-6">
    <div class="flex items-center justify-between gap-3">
      <p class="font-display text-xl font-semibold">Overview</p>
      <span class="rounded-lg bg-(--p-primary) px-3 py-1.5 text-xs font-semibold text-(--p-on-primary)">
        New invoice
      </span>
    </div>

    <div class="grid gap-3 sm:grid-cols-3">
      {#each kpis as kpi, index (kpi.label)}
        <div class="rounded-xl border border-(--p-line) bg-(--p-surface) p-3.5">
          <p class="text-xs text-(--p-muted)">{kpi.label}</p>
          <p class="tabular mt-1 text-2xl font-semibold tracking-tight">{kpi.value}</p>
          <span
            class="tabular mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style="background: color-mix(in oklab, {roles.series[index % roles.series.length]} 24%, transparent)"
          >
            {kpi.delta}
          </span>
        </div>
      {/each}
    </div>

    <div class="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
      <div class="rounded-xl border border-(--p-line) bg-(--p-surface) p-4">
        <p class="text-sm font-medium">Revenue by month</p>
        <div class="mt-4 flex h-36 items-end gap-1.5" aria-hidden="true">
          {#each bars as value, index (index)}
            <span
              class="flex-1 rounded-t-md"
              style="height: {value}%; background: {roles.series[index % roles.series.length]}"
            ></span>
          {/each}
        </div>
      </div>
      <div class="rounded-xl border border-(--p-line) bg-(--p-surface) p-4">
        <p class="text-sm font-medium">Client growth</p>
        <svg viewBox="0 0 300 100" class="mt-4 h-36 w-full overflow-visible" preserveAspectRatio="none" aria-hidden="true">
          <path d="{path} L300 100 L0 100 Z" fill="var(--p-accent)" fill-opacity="0.18" />
          <path d={path} fill="none" stroke="var(--p-accent)" stroke-width="2.5" vector-effect="non-scaling-stroke" stroke-linejoin="round" />
        </svg>
      </div>
    </div>

    <div class="overflow-hidden rounded-xl border border-(--p-line) bg-(--p-surface)">
      <table class="w-full text-left text-sm">
        <thead class="text-xs text-(--p-muted)">
          <tr><th class="px-4 py-2.5 font-medium">Client</th><th class="px-4 py-2.5 font-medium">Amount</th><th class="px-4 py-2.5 font-medium">Status</th></tr>
        </thead>
        <tbody>
          {#each rows as row (row.client)}
            <tr class="border-t border-(--p-line)">
              <td class="px-4 py-2.5">{row.client}</td>
              <td class="tabular px-4 py-2.5">{row.amount}</td>
              <td class="px-4 py-2.5">
                <span
                  class="rounded-full px-2 py-0.5 text-xs font-semibold {row.status === 'Paid'
                    ? 'bg-(--p-secondary) text-(--p-on-secondary)'
                    : 'bg-(--p-accent) text-(--p-on-accent)'}"
                >
                  {row.status}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
