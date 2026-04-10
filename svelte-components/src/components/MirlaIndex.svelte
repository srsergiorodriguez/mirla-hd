<svelte:options customElement="mirla-index" />

<script>
  let { 
    type = "", 
    itemsPerPage = 12,
    filters = "" 
  } = $props();

  const collectionData = window.MIRLA_COLLECTION_DATA || { items: [], filters: [], protocol: {} };
  const allItems = collectionData.items || [];
  const protocol = collectionData.protocol || {};
  
  // Wrapped in $derived so Svelte 5 maintains the reactivity chain
  let filterKeys = $derived(
    filters ? filters.split(',').map(s => s.trim()) : (collectionData.filters || [])
  );

  const i18n = window.MIRLA_CONTEXT?.i18n || {
    searchPlaceholder: "Search...",
    resultsFound: "results found",
    all: "All",
    clearSearch: "Clear search"
  };

  const siteDomain = window.MIRLA_CONTEXT?.siteDomain || "";

  let searchQuery = $state("");
  let activeFilters = $state({});
  let currentPage = $state(0);

  let baseItems = $derived.by(() => {
    if (!type) {
      return allItems.filter(item => !item._collection_type);
    }
    return allItems.filter(item => item._collection_type === type);
  });

  let filteredItems = $derived(
    baseItems.filter(item => {
      const matchesSearch = searchQuery.trim() === "" || 
        Object.values(item).some(val => 
          String(val).toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
        if (!value || value === "") return true;
        
        const itemVal = item[key];
        let strVal = "";
        
        if (Array.isArray(itemVal)) {
          strVal = itemVal.map(v => typeof v === 'object' && v !== null ? v.label || v.pid : String(v)).join(",");
        } else if (typeof itemVal === 'object' && itemVal !== null) {
          strVal = itemVal.label || itemVal.pid;
        } else {
          strVal = String(itemVal || "");
        }
        
        return strVal === String(value);
      });

      return matchesSearch && matchesFilters;
    })
  );

  let totalPages = $derived(Math.ceil(filteredItems.length / itemsPerPage));
  let paginatedItems = $derived(
    filteredItems.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
  );

  $effect(() => {
    searchQuery;
    activeFilters;
    currentPage = 0;
  });

  function getUniqueOptions(key) {
    const options = baseItems.flatMap(item => {
      const val = item[key];
      if (val === undefined || val === null || val === "") return [];
      
      if (Array.isArray(val)) {
         return val.map(v => typeof v === 'object' && v !== null ? v.label || v.pid : String(v));
      } else if (typeof val === 'object' && val !== null) {
         return [val.label || val.pid];
      }
      return [String(val)];
    });
    return [...new Set(options)].sort();
  }

  function clearAll() {
    searchQuery = "";
    let resetFilters = {};
    filterKeys.forEach(key => resetFilters[key] = "");
    activeFilters = resetFilters;
  }
</script>

<div class="mirla-app-container">
  
  <div class="controls-container">
    <div class="search-bar-container">
      <input 
        id="mirla-search-input" 
        class="search-bar" 
        type="search" 
        placeholder={i18n.searchPlaceholder} 
        bind:value={searchQuery} 
      />
    </div>

    {#if filterKeys.length > 0}
      <div class="filters-grid">
        {#each filterKeys as key}
          <div class="filter-group">
            <label for="filter-{key.replace(/\s+/g, '-')}">{key}</label>
            <select id="filter-{key.replace(/\s+/g, '-')}" class="filter-select" bind:value={activeFilters[key]}>
              <option value="">- {i18n.all} -</option>
              {#each getUniqueOptions(key) as option}
                <option value={option}>{option}</option>
              {/each}
            </select>
          </div>
        {/each}
      </div>
    {/if}

    <div class="status-bar">
      <span><strong>{filteredItems.length}</strong> {i18n.resultsFound}</span>
      <div class="status-actions">
        {#if searchQuery || Object.values(activeFilters).some(v => v !== "")}
          <button class="reset-btn" onclick={clearAll} title={i18n.clearSearch}>
            {i18n.clearSearch}
          </button>
        {/if}
      </div>
    </div>
  </div>

  {#if totalPages > 1}
    <div class="pager-container">
      <button class="pager-btn outline" disabled={currentPage === 0} onclick={() => currentPage--}>«</button>
      <div class="page-numbers">{currentPage + 1} / {totalPages}</div>
      <button class="pager-btn outline" disabled={currentPage >= totalPages - 1} onclick={() => currentPage++}>»</button>
    </div>
  {/if}

  <div class="preview-gallery">
    {#each paginatedItems as item (item.pid)}
      <div class="preview-item">
        <a href="{siteDomain}item/{item.pid}/index.html" class="card-link">
          <div class="image-container">
            {#if item.images && item.images.length > 0}
              <img src={item.images[0]} alt={item['label'] || item.pid} loading="lazy" />
            {:else}
              <div class="no-image-placeholder"></div>
            {/if}
          </div>
          <h3 class="item-title">{item['label'] || item.pid}</h3>
        </a>
      </div>
    {/each}
  </div>

  {#if totalPages > 1}
    <div class="pager-container">
      <button class="pager-btn outline" disabled={currentPage === 0} onclick={() => currentPage--}>«</button>
      <div class="page-numbers">{currentPage + 1} / {totalPages}</div>
      <button class="pager-btn outline" disabled={currentPage >= totalPages - 1} onclick={() => currentPage++}>»</button>
    </div>
  {/if}

</div>

<style>
  .mirla-app-container {
    margin: 2em 0;
    font-family: var(--pico-font-family, inherit);
    color: var(--pico-color, inherit);
    --mirla-border: color-mix(in srgb, var(--pico-color, currentColor) 20%, transparent);
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
    margin-bottom: 1.5rem;
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

  .search-bar:focus, .filter-select:focus {
    border-color: var(--pico-primary, #3498db);
    box-shadow: 0 0 0 calc(var(--pico-outline-width, 3px) / 2) var(--sl-focus-ring-color, rgba(52, 152, 219, 0.2));
  }

  .filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
  }

  .filter-group label {
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 0.4rem;
    text-transform: capitalize;
    color: var(--pico-muted-color, #777);
  }

  .filter-select {
    margin: 0;
    padding: 0.5rem 0.8rem;
    font-family: inherit;
    font-size: 0.9rem;
    color: var(--pico-color, inherit);
    background-color: var(--sl-input-background-color, var(--pico-background-color, #fff));
    border: 1px solid var(--mirla-border);
    border-radius: var(--pico-border-radius, 8px);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
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

  .reset-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.3rem 1rem;
    margin: 0;
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 600;
    line-height: 1.2;
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

  /* --- GALLERY STYLES --- */
  .preview-gallery {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1.2rem;
  }

  .preview-item {
    transition: transform 0.2s ease;
  }

  .preview-item:hover {
    transform: translateY(-4px);
  }

  .card-link {
    text-decoration: none;
    color: var(--pico-color, inherit);
    display: block;
  }

  .image-container {
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: var(--pico-border-radius, 8px);
    overflow: hidden;
    background: var(--mirla-border);
    border: 1px solid var(--mirla-border);
  }

  .image-container img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .no-image-placeholder {
    width: 100%;
    height: 100%;
    background-color: var(--pico-card-sectioning-background-color, rgba(0,0,0,0.05));
  }

  .item-title {
    padding: 0.8rem 0;
    margin: 0;
    font-size: 0.9rem;
    text-align: center;
    color: var(--pico-heading-color, inherit);
  }

  /* --- PAGER STYLES --- */
  .pager-container {
    display: flex;
    justify-content: right;
    align-items: center;
    gap: 1rem;
    margin: 2rem 0 1rem 0;
  }

  .pager-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: auto;
    padding: 0.25rem 1rem;
    margin: 0;
    font-size: 0.85rem;
    font-family: inherit;
    background-color: transparent;
    color: var(--pico-color, inherit);
    border: 1px solid var(--mirla-border);
    border-radius: 50px;
    line-height: 1.5;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;
  }

  .pager-btn:hover:not(:disabled) {
    background-color: var(--pico-primary, #3498db);
    color: var(--pico-primary-inverse, #fff);
    border-color: var(--pico-primary, #3498db);
  }

  .pager-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .page-numbers {
    font-size: 0.9rem;
    font-weight: 600;
  }
</style>