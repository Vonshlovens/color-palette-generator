<script lang="ts">
  import type { Snippet } from 'svelte';
  import Check from '@lucide/svelte/icons/check';
  import Copy from '@lucide/svelte/icons/copy';

  interface Props {
    value: string;
    /** What is copied, for the accessible name, e.g. "HEX #3b82f6". */
    label: string;
    class?: string;
    style?: string;
    /** Custom content; receives whether the value was just copied. */
    children?: Snippet<[boolean]>;
  }

  let { value, label, class: className = '', style, children }: Props = $props();

  let copied = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function copy(event: MouseEvent) {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      copied = true;
      clearTimeout(timer);
      timer = setTimeout(() => (copied = false), 1400);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }
</script>

<button type="button" class={className} {style} onclick={copy} aria-label="Copy {label}" title="Copy {label}">
  {#if children}
    {@render children(copied)}
  {:else if copied}
    <Check class="size-3.5" aria-hidden="true" />
  {:else}
    <Copy class="size-3.5" aria-hidden="true" />
  {/if}
</button>
<span class="sr-only" aria-live="polite">{copied ? `Copied ${label}` : ''}</span>
