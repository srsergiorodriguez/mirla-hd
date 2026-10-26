<svelte:options customElement="mirla-table" />

<script>
  import { getCollection, getI18n, sortItems } from '$lib/data.js';
  import Button from '$lib/ui/Button.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import SearchField from '$lib/ui/SearchField.svelte';
  import StatusBar from '$lib/ui/StatusBar.svelte';
  import Surface from '$lib/ui/Surface.svelte';
  import TableShell from '$lib/ui/TableShell.svelte';

  let {
    title = undefined,
    excludedKeys = ''
  } = $props();

  const collectionData = getCollection();
  const metadata = collectionData.items;

  const i18n = getI18n(globalThis, {
    searchPlaceholder: 'Search...',
    resultsFound: 'results found',
    downloadCSV: 'Download CSV',
    clearSearch: 'Clear search',
    noRecordsFound: 'No records found.',
    collectionMetadata: 'Collection Metadata'
  });

  let displayTitle = $derived(title !== undefined ? title : i18n.collectionMetadata);

  let searchQuery = $state('');
  let sortKey = $state('');
  let sortAsc = $state(true);

  const columns = $derived.by(() => {
    if (metadata.length === 0) return [];
    const excludedList = excludedKeys.split(',').map((entry) => entry.trim().toLowerCase());

    return Object.keys(metadata[0]).filter((key) => {
      return !key.startsWith('_') && !excludedList.includes(key.toLowerCase());
    });
  });

  let processedData = $derived.by(() => {
    let data = metadata;

    if (searchQuery.trim() !== '') {
      const lowerQuery = searchQuery.toLowerCase();
      data = data.filter((row) => {
        return columns.some((column) =>
          String(row[column] || '').toLowerCase().includes(lowerQuery)
        );
      });
    }

    return sortItems(data, sortKey, sortAsc);
  });

  function handleSort(column) {
    if (sortKey === column) {
      sortAsc = !sortAsc;
    } else {
      sortKey = column;
      sortAsc = true;
    }
  }

  function downloadMetadata() {
    if (processedData.length === 0) return;

    let csvContent = columns.join(',') + '\n';

    processedData.forEach((row) => {
      const rowString = columns
        .map((column) => {
          let value = String(row[column] || '');
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',');
      csvContent += rowString + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'mirla_metadata_export.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }
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
      <Button variant="primary" onclick={downloadMetadata} title={i18n.downloadCSV}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        {i18n.downloadCSV}
      </Button>
    </StatusBar>
  </Surface>

  <TableShell>
    {#if processedData.length === 0}
      <EmptyState variant="table">{i18n.noRecordsFound}</EmptyState>
    {:else}
      <table class="mirla-table">
        <thead>
          <tr>
            {#each columns as column}
              <th onclick={() => handleSort(column)} class="sortable-th">
                <div class="th-content">
                  {column}
                  {#if sortKey === column}
                    <span class="sort-icon">{sortAsc ? '▲' : '▼'}</span>
                  {:else}
                    <span class="sort-icon inactive">▲</span>
                  {/if}
                </div>
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each processedData as row}
            <tr>
              {#each columns as column}
                <td>{row[column]}</td>
              {/each}
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

  .sortable-th {
    cursor: pointer;
    user-select: none;
    transition: background-color var(--mirla-duration-fast, 0.2s);
  }

  .sortable-th:hover {
    background: var(--mirla-surface-muted, var(--pico-card-sectioning-background-color, rgba(0, 0, 0, 0.05)));
  }

  .th-content {
    display: flex;
    align-items: center;
    gap: var(--mirla-space-md, 0.5rem);
  }

  .sort-icon {
    font-size: 0.7em;
    color: var(--mirla-primary, var(--pico-primary, #3498db));
  }

  .sort-icon.inactive {
    color: transparent;
  }

  .sortable-th:hover .sort-icon.inactive {
    color: var(--mirla-text-muted, var(--pico-muted-color, #888));
    opacity: 0.5;
  }

  .mirla-table td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--mirla-border, color-mix(in srgb, var(--pico-color, currentColor) 20%, transparent));
    vertical-align: top;
  }

  .mirla-table tr:last-child td {
    border-bottom: none;
  }
</style>
