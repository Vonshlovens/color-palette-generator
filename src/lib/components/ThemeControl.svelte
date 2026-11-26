<script lang="ts">
  import { onMount } from 'svelte';
  import Monitor from '@lucide/svelte/icons/monitor';
  import Moon from '@lucide/svelte/icons/moon';
  import Sun from '@lucide/svelte/icons/sun';

  type Theme = 'light' | 'dark' | 'system';

  const storageKey = 'palette-theme';
  const options = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor }
  ] satisfies { value: Theme; label: string; icon: typeof Sun }[];

  let theme = $state<Theme>('system');
  let systemQuery: MediaQueryList | undefined;

  function applyTheme(selectedTheme: Theme) {
    const useDark =
      selectedTheme === 'dark' || (selectedTheme === 'system' && systemQuery?.matches === true);
    document.documentElement.classList.toggle('dark', useDark);
    document.documentElement.style.colorScheme = useDark ? 'dark' : 'light';
  }

  function selectTheme(selectedTheme: Theme) {
    theme = selectedTheme;
    try {
      localStorage.setItem(storageKey, selectedTheme);
    } catch {
      // The theme still works when storage is unavailable.
    }
    applyTheme(selectedTheme);
  }

  onMount(() => {
    systemQuery = window.matchMedia('(prefers-color-scheme: dark)');
    try {
      const storedTheme = localStorage.getItem(storageKey);
      if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
        theme = storedTheme;
      }
    } catch {
      theme = 'system';
    }

    applyTheme(theme);
    const handleSystemChange = () => {
      if (theme === 'system') applyTheme('system');
    };
    systemQuery.addEventListener('change', handleSystemChange);
    return () => systemQuery?.removeEventListener('change', handleSystemChange);
  });
</script>

<div class="segmented [&>button]:size-8 [&>button]:px-0" role="group" aria-label="Color theme">
  {#each options as option}
    {@const Icon = option.icon}
    <button
      type="button"
      aria-label="Use {option.label.toLowerCase()} theme"
      aria-pressed={theme === option.value}
      title="{option.label} theme"
      onclick={() => selectTheme(option.value)}
    >
      <Icon class="size-4" aria-hidden="true" />
    </button>
  {/each}
</div>
