<svelte:options customElement="mirla-index" />

<script>
  import {
    filterItems,
    getCollection,
    getContext,
    getI18n,
    getUniqueOptions
  } from '$lib/data.js';
  import Button from '$lib/ui/Button.svelte';
  import FilterSelect from '$lib/ui/FilterSelect.svelte';
  import ItemGrid from '$lib/ui/ItemGrid.svelte';
  import Pager from '$lib/ui/Pager.svelte';
  import SearchField from '$lib/ui/SearchField.svelte';
  import StatusBar from '$lib/ui/StatusBar.svelte';
  import Surface from '$lib/ui/Surface.svelte';

  let {
    type = '',
    itemsPerPage = 12,
    filters = ''
  } = $props();

  const collectionData = getCollection();
  const allItems = collectionData.items;
  const context = getContext();
  const siteDomain = context.siteDomain;

  const i18n = getI18n(globalThis, {
    searchPlaceholder: 'Search...',
    resultsFound: 'results found',
    all: 'All',
    clearSearch: 'Clear search'
  });

  let filterKeys = $derived(
    filters ? filters.split(',').map((entry) => entry.trim()) : (collectionData.filters || [])
  );

  let searchQuery = $state('');
  let activeFilters = $state({});
  let currentPage = $state(0);

  let baseItems = $derived.by(() => {
    if (!type) {
      return allItems.filter((item) => !item._collection_type);
    }
    return allItems.filter((item) => item._collection_type === type);
  });

  let filteredItems = $derived(
    filterItems(baseItems, { query: searchQuery, filters: activeFilters })
  );

  let totalPages = $derived(Math.ceil(filteredItems.length / itemsPerPage));
  let paginatedItems = $derived(
    filteredItems.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
  );

  $effect(() => {
    searchQuery;
    Object.values(activeFilters).join('|');
    currentPage = 0;
  });

  function clearAll() {
    searchQuery = '';
    const resetFilters = {};
    filterKeys.forEach((key) => {
      resetFilters[key] = '';
    });
    activeFilters = resetFilters;
  }
</script>

<div class="mirla-app-container">
  <Surface>
    <SearchField
      bind:value={searchQuery}
      placeholder={i18n.searchPlaceholder}
      label={i18n.searchPlaceholder}
      spacing="lg"
    />

    {#if filterKeys.length > 0}
      <div class="filters-grid">
        {#each filterKeys as key}
          <FilterSelect
            label={key}
            options={getUniqueOptions(baseItems, key)}
            allLabel={`- ${i18n.all} -`}
            bind:value={activeFilters[key]}
          />
        {/each}
      </div>
    {/if}

    <StatusBar count={filteredItems.length} suffix={i18n.resultsFound}>
      {#if searchQuery || Object.values(activeFilters).some((value) => value !== '')}
        <Button variant="ghost" size="md" onclick={clearAll} title={i18n.clearSearch}>
          {i18n.clearSearch}
        </Button>
      {/if}
    </StatusBar>
  </Surface>

  <Pager
    page={currentPage + 1}
    {totalPages}
    onPrev={() => currentPage--}
    onNext={() => currentPage++}
  />

  <ItemGrid items={paginatedItems} {siteDomain} variant="index" />

  <Pager
    page={currentPage + 1}
    {totalPages}
    onPrev={() => currentPage--}
    onNext={() => currentPage++}
  />
</div>

<style>
  .mirla-app-container {
    margin: var(--mirla-space-5xl, 2em) 0;
    font-family: var(--mirla-font-body, var(--pico-font-family, inherit));
    color: var(--mirla-text, var(--pico-color, inherit));
  }

  .filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: var(--mirla-space-2xl, 1rem);
    margin-bottom: var(--mirla-space-2xl, 1rem);
  }
</style>
