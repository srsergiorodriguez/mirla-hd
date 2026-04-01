<svelte:options customElement="mirla-waffle" />

<script>
  import { fade } from 'svelte/transition';
  import ItemsBar from "$lib/ItemsBar.svelte";

  let { 
    key = ""
  } = $props();

  const collectionData = window.MIRLA_COLLECTION_DATA || { items: [] };
  const metadata = collectionData.items;
  const siteDomain = window.MIRLA_CONTEXT?.siteDomain || "";

  const categoricalPalette = [
    "#e60049", "#0bb4ff", "#50e991", "#e6d800", "#9b19f5", 
    "#ffa300", "#dc0ab4", "#b3d4ff", "#00bfa0", "#97421d"
  ];

  let selectedItems = $state([]);
  let activeCategory = $state(null);
  let hoveredCategory = $state(null);

  const splitValues = (val) => {
    if (val === null || val === undefined) return [];
    if (typeof val !== 'string') return [String(val)];
    return val.split(/[;,]+/).map(s => s.trim()).filter(s => s !== "");
  };

  let chartData = $derived.by(() => {
    if (!key || metadata.length === 0) return { cells: [], legend: [] };

    const itemMap = new Map();
    let totalValid = 0;

    metadata.forEach(item => {
      const vals = splitValues(item[key]);
      vals.forEach(v => {
        if (!itemMap.has(v)) itemMap.set(v, []);
        itemMap.get(v).push(item);
        totalValid++;
      });
    });

    if (totalValid === 0) return { cells: [], legend: [] };

    let groups = Array.from(itemMap.entries()).map(([k, items]) => {
      const quota = (items.length / totalValid) * 100;
      return { 
        key: k, 
        items, 
        count: items.length, 
        quota, 
        int: Math.floor(quota), 
        remainder: quota - Math.floor(quota) 
      };
    });

    groups.sort((a, b) => b.count - a.count);

    if (groups.length > 10) {
      const top9 = groups.slice(0, 9);
      const others = groups.slice(9);
      let otherItems = [];
      others.forEach(o => otherItems.push(...o.items));
      
      const otherQuota = (otherItems.length / totalValid) * 100;
      top9.push({
        key: "Other",
        items: otherItems,
        count: otherItems.length,
        quota: otherQuota,
        int: Math.floor(otherQuota),
        remainder: otherQuota - Math.floor(otherQuota)
      });
      groups = top9;
    }

    let allocated = groups.reduce((sum, g) => sum + g.int, 0);
    let remainders = [...groups].sort((a, b) => b.remainder - a.remainder);
    
    for (let i = 0; i < 100 - allocated; i++) {
      if (remainders[i]) remainders[i].int++;
    }

    let cells = [];
    groups.forEach((g, index) => {
      const color = categoricalPalette[index % categoricalPalette.length];
      g.color = color; 
      
      for (let i = 0; i < g.int; i++) {
        cells.push({ category: g.key, items: g.items, color });
      }
    });

    return { cells, legend: groups };
  });

  function handleReset() {
    selectedItems = [];
    activeCategory = null;
  }

  function selectCategory(categoryData) {
    if (activeCategory === categoryData.key) {
      handleReset();
    } else {
      selectedItems = categoryData.items;
      activeCategory = categoryData.key;
    }
  }

  // Keyboard accessibility handler
  function handleKeydown(event, categoryData) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectCategory(categoryData);
    }
  }
</script>

<div class="mirla-waffle-outer">
  {#if chartData.cells.length === 0}
    <div class="mirla-error">NO DATA FOUND FOR KEY "{key}"</div>
  {:else}
    <div class="waffle-layout">
      <div class="waffle-grid" role="group" aria-label="Waffle chart grid" onmouseleave={() => hoveredCategory = null}>
        {#each chartData.cells as cell}
          <div 
            role="button"
            tabindex="0"
            class="waffle-cell"
            style="background-color: {cell.color};"
            class:dimmed={(activeCategory && activeCategory !== cell.category) || (hoveredCategory && hoveredCategory !== cell.category)}
            onclick={() => selectCategory(cell)}
            onkeydown={(e) => handleKeydown(e, cell)}
            onmouseenter={() => hoveredCategory = cell.category}
            aria-label="View {cell.category} items"
            title="{cell.category} ({cell.items.length})"
          ></div>
        {/each}
        
        {#if activeCategory}
          <button class="reset-viz-btn" onclick={handleReset} title="Reset">↺</button>
        {/if}
      </div>

      <div class="waffle-legend" role="list">
        {#each chartData.legend as item}
          <div 
            role="button"
            tabindex="0"
            class="legend-item"
            class:dimmed={(activeCategory && activeCategory !== item.key) || (hoveredCategory && hoveredCategory !== item.key)}
            onclick={() => selectCategory(item)}
            onkeydown={(e) => handleKeydown(e, item)}
            onmouseenter={() => hoveredCategory = item.key}
            onmouseleave={() => hoveredCategory = null}
            aria-label="Filter by {item.key}"
          >
            <span class="legend-color" style="background-color: {item.color};" aria-hidden="true"></span>
            <span class="legend-label">{item.key} <small>({item.count})</small></span>
          </div>
        {/each}
      </div>
    </div>

    <ItemsBar 
      items={selectedItems} 
      {siteDomain} 
      onclose={handleReset} 
    />
  {/if}
</div>

<style>
  .mirla-waffle-outer {
    width: 100%;
    margin: 2em 0;
    font-family: var(--pico-font-family, inherit);
    color: var(--pico-color, inherit);
  }

  .waffle-layout {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center; /* Centers everything horizontally */
    gap: 2rem;
  }

  @media (min-width: 600px) {
    .waffle-layout {
      flex-direction: row;
      align-items: center;
      justify-content: center; /* Keeps it centered when side-by-side */
    }
  }

  .waffle-grid {
    position: relative;
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    gap: 3px;
    width: 100%;
    max-width: 350px;
    margin: 0; /* Removed the 'auto' margin so flexbox can properly center it */
    flex-shrink: 0;
  }

  .waffle-cell {
    aspect-ratio: 1;
    border-radius: 2px;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.1s;
    box-shadow: inset 0 0 0 1px rgba(0,0,0,0.05);
    /* Removes the outline only for mouse clicks, keeps it for keyboard focus */
    outline: none; 
  }

  .waffle-cell:focus-visible {
    box-shadow: 0 0 0 2px var(--pico-primary, #4a90e2);
  }

  .waffle-cell:hover {
    transform: scale(1.1);
    z-index: 2;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  .waffle-legend {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    /* Removed flex-grow: 1 so it hugs its content instead of stretching */
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.85rem;
    transition: opacity 0.2s;
    outline: none;
  }

  .legend-item:focus-visible {
    outline: 2px solid var(--pico-primary, #4a90e2);
    border-radius: 2px;
  }

  .legend-item:hover .legend-label {
    text-decoration: underline;
  }

  .legend-color {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .legend-label {
    line-height: 1.2;
  }

  .legend-label small {
    color: var(--pico-muted-color, #888);
  }

  .dimmed {
    opacity: 0.2;
  }

  .reset-viz-btn {
    position: absolute;
    top: -12px;
    right: -12px;
    background: var(--pico-card-background-color, rgba(255, 255, 255, 0.9));
    border: 1px solid var(--pico-form-element-border-color, rgba(0,0,0,0.1));
    border-radius: 50%;
    width: 32px;
    height: 32px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    color: var(--pico-color, #555);
    z-index: 10;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .mirla-error {
    padding: 1em;
    border: 1px dashed var(--pico-del-color, red);
    color: var(--pico-del-color, red);
    font-family: monospace;
    font-weight: bold;
    text-align: center;
    border-radius: var(--pico-border-radius, 8px);
  }
</style>