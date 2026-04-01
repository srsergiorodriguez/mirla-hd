<script>
  import { onMount } from 'svelte';
  import devData from '$collection/collection.json';

  let { config } = $props();

  let metadataItems = $state([]);
  let protocol = $state({});
  let filters = $state([]);
  let loading = $state(true);
  
  let searchQuery = $state("");
  let activeFilters = $state({});
  let currentPage = $state(0);
  let itemsPerPage = $state(12);

  const isLive = window.location.protocol.startsWith('http');

  // Filtering Logic
  let filteredItems = $derived(
    metadataItems.filter(item => {
      const matchesSearch = searchQuery.trim() === "" || 
        Object.values(item).some(val => 
          String(val).toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
        if (!value || value === "") return true;
        return String(item[key]) === String(value);
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

  async function loadData() {
    try {
      let data;
      if (!isLive || window.location.hostname === 'localhost') {
        data = devData;
      } else {
        const url = `${config.mediaUrl}collection/collection.json`;
        const response = await fetch(url);
        data = await response.json();
      }
      
      metadataItems = data.items || [];
      protocol = data.protocol || {};
      filters = data.filters || [];

      console.log(data);
    } catch (err) {
      console.error("[Mirla App] Error:", err);
    } finally {
      loading = false;
    }
  }

  function getUniqueOptions(key) {
    const options = metadataItems.map(item => item[key]).filter(v => v !== undefined && v !== null && v !== "");
    return [...new Set(options)].sort();
  }

  onMount(() => { loadData(); });
</script>

<div class="mirla-app-container">
  {#if loading}
    <div class="loading-state">...</div>
  {:else}
    
    <div class="controls-container">
      <div class="search-bar-container">
        <input 
          id="mirla-search-input" 
          class="search-bar" 
          type="text" 
          placeholder="..." 
          bind:value={searchQuery} 
        />
        <span class="search-icon">⌕</span>
      </div>

      <div class="filters-grid">
        {#each filters as key}
          {#if protocol[key]}
            <div class="filter-group">
              <label for="filter-{key}">{key}</label>
              <select id="filter-{key}" bind:value={activeFilters[key]}>
                <option value="">-</option>
                {#each getUniqueOptions(key) as option}
                  <option value={option}>{option}</option>
                {/each}
              </select>
            </div>
          {/if}
        {/each}
      </div>

      <div class="status-bar">
        <span>({filteredItems.length})</span>
        {#if searchQuery || Object.values(activeFilters).some(v => v !== "")}
          <button class="reset-btn" onclick={() => { searchQuery = ""; activeFilters = {}; }}>×</button>
        {/if}
      </div>
    </div>

    <!-- pager -->
    {#if totalPages > 1}
      <div class="pager-container">
        <button disabled={currentPage === 0} onclick={() => currentPage--}>«</button>
        <div class="page-numbers">{currentPage + 1} / {totalPages}</div>
        <button disabled={currentPage >= totalPages - 1} onclick={() => currentPage++}>»</button>
      </div>
    {/if}

    <div class="preview-gallery">
      {#each paginatedItems as item (item.pid)}
        <div class="preview-item">
          <a href={ isLive ? `${config.siteDomain}item/${item.pid}/` : `${config.siteDomain}item/${item.pid}/index.html` } class="card-link">
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

    <!-- pager -->
    {#if totalPages > 1}
      <div class="pager-container">
        <button disabled={currentPage === 0} onclick={() => currentPage--}>«</button>
        <div class="page-numbers">{currentPage + 1} / {totalPages}</div>
        <button disabled={currentPage >= totalPages - 1} onclick={() => currentPage++}>»</button>
      </div>
    {/if}

  {/if}
</div>

<style>
  .controls-container {
    background: #88888815;
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 2rem;
  }

  .search-bar-container {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
  }

  .search-bar {
    flex-grow: 1;
    padding: 0.6rem 1rem;
    font-size: 1.1rem;
    border: 1px solid #ccc;
    border-radius: 30px;
    outline: none;
  }

  .search-icon {
    font-size: 2.5rem;
    color: #ccc;
    margin-left: 0.5rem;
  }

  .filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
  }

  .filter-group label {
    font-size: 0.8rem;
    font-weight: bold;
    margin-bottom: 0.3rem;
    text-transform: capitalize;
    color: #666;
  }

  .filter-group select {
    padding: 0.4rem;
    border-radius: 4px;
    border: 1px solid #ccc;
  }

  .status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
    border-top: 1px solid #eee;
    padding-top: 1rem;
  }

  .reset-btn {
    background: none;
    border: none;
    color: #cc0000;
    cursor: pointer;
    text-decoration: underline;
  }

  /* Gallery Styles */
  .preview-gallery {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 2em;
  }

  .preview-item {
    transition: transform 0.2s ease;
  }

  .preview-item:hover {
    transform: translateY(-4px);
  }

  .image-container {
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: 6px;
    overflow: hidden;
    background: #eee;
  }

  .image-container img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .item-title {
    padding: 1rem 0;
    margin: 0;
    font-size: 1rem;
    text-align: center;
  }

  /* Pager Styles */
  .pager-container {
    display: flex;
    justify-content: right;
    align-items: center;
    gap: 1rem;
    margin-top: 2rem;
    padding-bottom: 1rem;
  }

  .pager-container button {
    padding: 0.5rem 1.5rem;
    border-radius: 20px;
    border: 1px solid #888;
    background: #eeeeee88;
    cursor: pointer;
  }

  .pager-container button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>