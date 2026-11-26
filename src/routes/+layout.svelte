<script>
  import '../app.css';
  import StudioHeader from '$lib/components/StudioHeader.svelte';

  let { children } = $props();
</script>

<StudioHeader />

{@render children()}
