<script>
  import '../app.css';
  import StudioHeader from '$lib/components/StudioHeader.svelte';
  import { setStudioStoresContext } from '$lib/stores/palette.svelte';

  let { children } = $props();

  setStudioStoresContext();
</script>

<StudioHeader />

{@render children()}
