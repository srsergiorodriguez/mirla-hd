<svelte:options customElement="mirla-protocol" />

<script>
  import { getCollection, getI18n } from '$lib/data.js';
  import Button from '$lib/ui/Button.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import SearchField from '$lib/ui/SearchField.svelte';
  import StatusBar from '$lib/ui/StatusBar.svelte';
  import Surface from '$lib/ui/Surface.svelte';
  import TableShell from '$lib/ui/TableShell.svelte';

  let {
    title = undefined,
    excludedKeys = '' // Kept for API compatibility; filtering is not implemented yet.
  } = $props();

  const collectionData = getCollection();
  const rawProtocol = collectionData.protocol || {};

  const i18n = getI18n(globalThis, {
    searchPlaceholder: 'Search protocol...',
    resultsFound: 'attributes found',
    clearSearch: 'Clear search',
    noRecordsFound: 'No attributes found in protocol.',
    dataDictionary: 'Data Dictionary',
    protocolAttr: 'Attribute',
    protocolType: 'Data Type',
    protocolDesc: 'Description & Rules'
  });

  let displayTitle = $derived(title !== undefined ? title : i18n.dataDictionary);

  let protocolArray = $derived(
    Object.entries(rawProtocol).map(([attribute, data]) => ({
      attribute,
      type: data.type,
      description: data.description || '—'
    }))
  );

  let searchQuery = $state('');

  let processedData = $derived.by(() => {
    if (searchQuery.trim() === '') return protocolArray;

    const lowerQuery = searchQuery.toLowerCase();
    return protocolArray.filter((entry) => {
      return (
        String(entry.attribute).toLowerCase().includes(lowerQuery) ||
        String(entry.description).toLowerCase().includes(lowerQuery) ||
        String(entry.type).toLowerCase().includes(lowerQuery)
      );
    });
  });
</script>

<div class="mirla-table-outer">
  {#if displayTitle}
    <h3 class="table-title">{displayTitle}</h3>
  {/if}

  <Surface>
    <SearchField
      bind:value={searchQuery}
      placeholder={i18n.searchPlaceholder}
      label={i18n.searchPlaceholder}
      spacing="none"
    />

    <StatusBar count={processedData.length} suffix={i18n.resultsFound}>
      {#if searchQuery}
        <Button
          variant="ghost"
          size="sm"
          onclick={() => (searchQuery = '')}
          title={i18n.clearSearch}
        >×</Button>
      {/if}
    </StatusBar>
  </Surface>

  <TableShell>
    {#if processedData.length === 0}
      <EmptyState variant="table">{i18n.noRecordsFound}</EmptyState>
    {:else}
      <table class="mirla-table">
        <thead>
          <tr>
            <th>{i18n.protocolAttr}</th>
            <th>{i18n.protocolType}</th>
            <th>{i18n.protocolDesc}</th>
          </tr>
        </thead>
        <tbody>
          {#each processedData as entry}
            <tr>
              <td class="attr-col"><code>{entry.attribute}</code></td>
              <td><span class="badge">{entry.type}</span></td>
              <td>{entry.description}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </TableShell>
</div>

<style>
  .mirla-table-outer {
    margin: var(--mirla-space-5xl, 2em) 0;
    font-family: var(--mirla-font-body, var(--pico-font-family, inherit));
    color: var(--mirla-text, var(--pico-color, inherit));
  }

  .table-title {
    margin-bottom: var(--mirla-space-2xl, 1rem);
    font-size: var(--mirla-fs-xl, 1.5rem);
    color: var(--mirla-heading, var(--pico-heading-color, inherit));
  }

  .mirla-table {
    margin: 0;
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9em;
  }

  .mirla-table th {
    position: sticky;
    top: 0;
    background: var(--mirla-surface, var(--pico-card-background-color, #fff));
    z-index: 2;
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 2px solid var(--mirla-border, color-mix(in srgb, var(--pico-color, currentColor) 20%, transparent));
    white-space: nowrap;
  }

  :global([data-theme="dark"]) .mirla-table th {
    background: var(--pico-background-color, #11191f);
  }

  .mirla-table td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--mirla-border, color-mix(in srgb, var(--pico-color, currentColor) 20%, transparent));
    vertical-align: top;
  }

  .mirla-table tr:last-child td {
    border-bottom: none;
  }

  .attr-col code {
    background-color: color-mix(in srgb, var(--pico-color, currentColor) 8%, transparent);
    padding: var(--mirla-space-3xs, 0.2rem) var(--mirla-space-md, 0.5rem);
    border-radius: var(--mirla-radius-sm, 4px);
    font-size: 0.9em;
  }

  .badge {
    display: inline-block;
    padding: var(--mirla-space-3xs, 0.2rem) var(--mirla-space-lg, 0.6rem);
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    background-color: color-mix(in srgb, var(--mirla-primary, var(--pico-primary, #3498db)) 15%, transparent);
    color: var(--mirla-primary, var(--pico-primary, #3498db));
    border-radius: var(--mirla-radius-pill, 50px);
    letter-spacing: 0.5px;
  }
</style>
