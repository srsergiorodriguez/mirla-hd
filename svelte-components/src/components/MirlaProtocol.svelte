<svelte:options customElement="mirla-protocol" />

<script>
  let { 
    title = undefined,
    excludedKeys = "" // Adding this just in case you want to hide protocol rows later!
  } = $props();

  const collectionData = window.MIRLA_COLLECTION_DATA || { protocol: {} };
  const rawProtocol = collectionData.protocol || {};

  // Grab translations from the global context, with English defaults
  const i18n = window.MIRLA_CONTEXT?.i18n || {
    searchPlaceholder: "Search protocol...",
    resultsFound: "attributes found",
    clearSearch: "Clear search",
    noRecordsFound: "No attributes found in protocol.",
    dataDictionary: "Data Dictionary",
    protocolAttr: "Attribute",
    protocolType: "Data Type",
    protocolDesc: "Description & Rules"
  };

  // If a user doesn't provide a title="" prop, use the translated default
  let displayTitle = $derived(title !== undefined ? title : i18n.dataDictionary);

  let protocolArray = $derived(
    Object.entries(rawProtocol).map(([attr, data]) => ({
      attribute: attr,
      type: data.type,
      description: data.description || "—"
    }))
  );

  let searchQuery = $state("");

  let processedData = $derived.by(() => {
    let data = protocolArray;

    if (searchQuery.trim() !== "") {
      const lowerQuery = searchQuery.toLowerCase();
      data = data.filter(entry => {
        return entry.attribute.toLowerCase().includes(lowerQuery) || 
               entry.description.toLowerCase().includes(lowerQuery) ||
               entry.type.toLowerCase().includes(lowerQuery);
      });
    }

    return data;
  });
</script>

<div class="mirla-table-outer">
  {#if displayTitle}
    <h3 class="table-title">{displayTitle}</h3>
  {/if}

  <div class="controls-container">
    <div class="search-bar-container">
      <input 
        id="mirla-protocol-search" 
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
  </div>
</div>

<style>
  /* EXACT SAME STYLING AS MIRLA-TABLE TO ENSURE VISUAL CONSISTENCY 
  */
  .mirla-table-outer {
    margin: 2em 0;
    font-family: var(--pico-font-family, inherit);
    color: var(--pico-color, inherit);
    
    --mirla-border: color-mix(in srgb, var(--pico-color, currentColor) 20%, transparent);
  }

  .table-title {
    margin-bottom: 1rem;
    font-size: 1.5rem;
    color: var(--pico-heading-color, inherit);
  }

  .controls-container {
    background: var(--pico-card-background-color, #f8f9fa);
    padding: 1.5rem;
    border-radius: var(--pico-border-radius, 8px);
    margin-bottom: 2rem;
    box-shadow: var(--pico-box-shadow, 0 2px 4px rgba(0,0,0,0.1));
    border: 1px solid var(--mirla-border);
  }

  .search-bar-container {
    display: flex;
    align-items: center;
    margin-bottom: 0;
  }

  .search-bar {
    width: 100%;
    margin: 0;
    padding: 0.6rem 1.2rem;
    font-family: inherit;
    font-size: 1rem;
    color: var(--pico-color, inherit);
    background-color: var(--sl-input-background-color, var(--pico-background-color, #fff));
    border: 1px solid var(--mirla-border);
    border-radius: 50px; 
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .search-bar:focus {
    border-color: var(--pico-primary, #3498db);
    box-shadow: 0 0 0 calc(var(--pico-outline-width, 3px) / 2) var(--sl-focus-ring-color, rgba(52, 152, 219, 0.2));
  }

  .status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
    border-top: 1px solid var(--mirla-border);
    padding-top: 1rem;
    margin-top: 1rem;
  }

  .status-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .reset-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.2rem 0.8rem;
    margin: 0;
    font-family: inherit;
    font-size: 1.2rem;
    line-height: 1;
    background-color: transparent;
    color: var(--pico-color, inherit);
    border: 1px solid var(--mirla-border);
    border-radius: 50px; 
    cursor: pointer;
    outline: none;
    transition: border-color 0.2s, color 0.2s;
  }

  .reset-btn:hover {
    border-color: var(--pico-primary, #3498db);
    color: var(--pico-primary, #3498db);
  }
  
  .reset-btn:focus {
    box-shadow: 0 0 0 calc(var(--pico-outline-width, 3px) / 2) var(--sl-focus-ring-color, rgba(52, 152, 219, 0.2));
  }

  .table-container {
    max-height: 500px;
    overflow: auto;
    position: relative;
    border: 1px solid var(--mirla-border);
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
    border-bottom: 2px solid var(--mirla-border);
    white-space: nowrap;
  }

  :global([data-theme="dark"]) .mirla-table th {
    background: var(--pico-background-color, #11191f);
  }

  .mirla-table td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--mirla-border);
    vertical-align: top;
  }

  .mirla-table tr:last-child td {
    border-bottom: none;
  }

  .mirla-empty {
    padding: 3rem;
    text-align: center;
    color: var(--pico-muted-color, #999);
    font-style: italic;
  }

  /* PROTOCOL SPECIFIC BADGES AND CODE BLOCKS 
  */
  .attr-col code {
    background-color: color-mix(in srgb, var(--pico-color, currentColor) 8%, transparent);
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-size: 0.9em;
  }

  .badge {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    background-color: color-mix(in srgb, var(--pico-primary, #3498db) 15%, transparent);
    color: var(--pico-primary, #3498db);
    border-radius: 50px;
    letter-spacing: 0.5px;
  }
</style>