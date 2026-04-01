<svelte:options customElement="mirla-table" />

<script>
  let { 
    title = undefined,
    excludedKeys = "" 
  } = $props();

  const collectionData = window.MIRLA_COLLECTION_DATA || { items: [] };
  const metadata = collectionData.items;

  const i18n = window.MIRLA_CONTEXT?.i18n || {
    searchPlaceholder: "Search...",
    resultsFound: "results found",
    downloadCSV: "Download CSV",
    clearSearch: "Clear search",
    noRecordsFound: "No records found.",
    collectionMetadata: "Collection Metadata"
  };

  let displayTitle = $derived(title !== undefined ? title : i18n.collectionMetadata);

  let searchQuery = $state("");
  let sortKey = $state("");
  let sortAsc = $state(true);

  const columns = $derived.by(() => {
    if (metadata.length === 0) return [];
    const excludedList = excludedKeys.split(',').map(s => s.trim().toLowerCase());
    
    return Object.keys(metadata[0]).filter(key => {
      return !key.startsWith('_') && !excludedList.includes(key.toLowerCase());
    });
  });

  let processedData = $derived.by(() => {
    let data = metadata;

    if (searchQuery.trim() !== "") {
      const lowerQuery = searchQuery.toLowerCase();
      data = data.filter(row => {
        return columns.some(col => String(row[col] || '').toLowerCase().includes(lowerQuery));
      });
    }

    if (sortKey) {
      data = [...data].sort((a, b) => {
        let valA = String(a[sortKey] || '').toLowerCase();
        let valB = String(b[sortKey] || '').toLowerCase();
        
        const numA = parseFloat(valA);
        const numB = parseFloat(valB);
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortAsc ? numA - numB : numB - numA;
        }

        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
    }
    
    return data;
  });

  function handleSort(col) {
    if (sortKey === col) {
      sortAsc = !sortAsc;
    } else {
      sortKey = col;
      sortAsc = true;
    }
  }

  function downloadMetadata() {
    if (processedData.length === 0) return;

    let csvContent = columns.join(",") + "\n";
    
    processedData.forEach(row => {
      let rowStr = columns.map(col => {
        let val = String(row[col] || "");
        if (val.includes(",") || val.includes('"') || val.includes("\n")) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(",");
      csvContent += rowStr + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "mirla_metadata_export.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }
</script>

<div class="mirla-table-outer">
  {#if displayTitle}
    <h3 class="table-title">{displayTitle}</h3>
  {/if}

  <div class="controls-container">
    <div class="search-bar-container">
      <input 
        id="mirla-table-search" 
        class="search-bar" 
        type="search" 
        placeholder={i18n.searchPlaceholder} 
        bind:value={searchQuery} 
      />
    </div>

    <div class="status-bar">
      <span><strong>{processedData.length}</strong> {i18n.resultsFound}</span>
      
      <div class="status-actions">
        {#if searchQuery}
          <button class="reset-btn outline" onclick={() => searchQuery = ""} title={i18n.clearSearch}>×</button>
        {/if}
        <button class="csv-btn" onclick={downloadMetadata} title={i18n.downloadCSV}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          CSV
        </button>
      </div>
    </div>
  </div>

  <div class="table-container">
    {#if processedData.length === 0}
      <div class="mirla-empty">{i18n.noRecordsFound}</div>
    {:else}
      <table class="mirla-table">
        <thead>
          <tr>
            {#each columns as col}
              <th onclick={() => handleSort(col)} class="sortable-th">
                <div class="th-content">
                  {col}
                  {#if sortKey === col}
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
              {#each columns as col}
                <td>{row[col]}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>

<style>
  .mirla-table-outer {
    margin: 2em 0;
    font-family: var(--pico-font-family, inherit);
    color: var(--pico-color, inherit);
  }

  .table-title {
    margin-bottom: 1rem;
    font-size: 1.5rem;
  }

  /* Microfrontend container replica */
  .controls-container {
    background: var(--pico-card-background-color, #f8f9fa);
    padding: 1.5rem;
    border-radius: var(--pico-border-radius);
    margin-bottom: 2rem;
    box-shadow: var(--pico-card-box-shadow);
    border: 1px solid var(--pico-form-element-border-color, rgba(0,0,0,0.1));
  }

  .search-bar-container {
    display: flex;
    align-items: center;
    margin-bottom: 0; 
  }

  /* Forcing the pill-shape to replicate global styles */
  .search-bar {
    margin-bottom: 0; 
    border-radius: 50px; 
    background-color: var(--pico-form-element-background-color);
  }

  .status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
    border-top: 1px solid var(--pico-form-element-border-color);
    padding-top: 1rem;
    margin-top: 1rem;
  }

  .status-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .reset-btn {
    width: auto;
    padding: 0.2rem 0.8rem;
    margin: 0;
    line-height: 1;
    cursor: pointer;
    border-radius: 50px; /* Matching the pill shape */
    -webkit-user-select: none;
    user-select: none;
  }

  /* Forcing the solid Pico primary color so it is never gray */
  .csv-btn {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 1rem;
    line-height: 1.2;
    width: auto;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    border-radius: 50px; 
    background-color: var(--pico-primary, #0172cb);
    color: var(--pico-primary-inverse, #fff);
    border: 1px solid var(--pico-primary, #0172cb);
    transition: background-color 0.2s, border-color 0.2s;
  }

  .csv-btn:hover {
    background-color: var(--pico-primary-hover, #01589b);
    border-color: var(--pico-primary-hover, #01589b);
  }

  /* Table Grid Styles */
  .table-container {
    max-height: 500px;
    overflow: auto;
    position: relative;
    border: 1px solid var(--pico-form-element-border-color, rgba(0,0,0,0.1));
    border-radius: var(--pico-border-radius, 8px);
    background: var(--pico-card-background-color, transparent);
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
    background: var(--pico-card-background-color, #fff);
    z-index: 2;
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 2px solid var(--pico-form-element-border-color, rgba(0,0,0,0.1));
    white-space: nowrap;
  }

  :global([data-theme="dark"]) .mirla-table th {
    background: var(--pico-background-color, #11191f);
  }

  .sortable-th {
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s;
  }

  .sortable-th:hover {
    background: var(--pico-card-sectioning-background-color, rgba(0,0,0,0.05));
  }

  .th-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .sort-icon {
    font-size: 0.7em;
    color: var(--pico-primary, #4a90e2);
  }

  .sort-icon.inactive {
    color: transparent;
  }

  .sortable-th:hover .sort-icon.inactive {
    color: var(--pico-muted-color, #888);
    opacity: 0.5;
  }

  .mirla-table td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--pico-form-element-border-color, rgba(0,0,0,0.05));
    vertical-align: top;
  }

  .mirla-table tr:last-child td {
    border-bottom: none;
  }

  .mirla-table tr:hover td {
    background: var(--pico-card-sectioning-background-color, rgba(0,0,0,0.02));
  }

  .mirla-empty {
    padding: 3rem;
    text-align: center;
    color: var(--pico-muted-color, #999);
    font-style: italic;
  }
</style>