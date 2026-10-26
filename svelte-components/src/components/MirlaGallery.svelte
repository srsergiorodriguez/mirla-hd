<svelte:options customElement="mirla-gallery" />

<script>
  import { getCollection, getContext, splitValues } from '$lib/data.js';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import ErrorState from '$lib/ui/ErrorState.svelte';
  import ItemGrid from '$lib/ui/ItemGrid.svelte';

  let {
    key = '',
    value = '',
    limit = ''
  } = $props();

  const collectionData = getCollection();
  const items = collectionData.items;
  const siteDomain = getContext().siteDomain;

  let filteredItems = $derived.by(() => {
    if (!key || !value) return [];

    let matches = items.filter((item) => splitValues(item[key]).includes(value));

    const max = parseInt(limit, 10);
    if (!Number.isNaN(max) && max > 0) {
      matches = matches.slice(0, max);
    }

    return matches;
  });
</script>

<div class="mirla-gallery-container">
  {#if !key || !value}
    <ErrorState>DEFINE 'KEY' AND 'VALUE' (e.g., key="Category" value="Art")</ErrorState>
  {:else if filteredItems.length === 0}
    <EmptyState variant="gallery">No items found for "{key}: {value}"</EmptyState>
  {:else}
    <ItemGrid items={filteredItems} {siteDomain} variant="gallery" />
  {/if}
</div>

<style>
  .mirla-gallery-container {
    width: 100%;
    margin: var(--mirla-space-6xl, 2.5em) 0;
    font-family: var(--mirla-font-body, var(--pico-font-family, inherit));
  }
</style>
