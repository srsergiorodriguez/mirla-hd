<svelte:options customElement="mirla-waffle" />

<script>
  import ItemsBar from '$lib/ItemsBar.svelte';
  import { buildWaffleData, getCollection, getContext } from '$lib/data.js';
  import ErrorState from '$lib/ui/ErrorState.svelte';
  import Legend from '$lib/ui/Legend.svelte';
  import ResetButton from '$lib/ui/ResetButton.svelte';

  let {
    key = ''
  } = $props();

  const collectionData = getCollection();
  const metadata = collectionData.items;
  const siteDomain = getContext().siteDomain;

  let selectedItems = $state([]);
  let activeCategory = $state(null);
  let hoveredCategory = $state(null);

  let chartData = $derived(buildWaffleData(metadata, key));

  function handleReset() {
    selectedItems = [];
    activeCategory = null;
  }

  function selectCategory(categoryData) {
    // Cells expose `category`; legend entries expose `key`. Accept both so
    // clicking a cell also activates the dimming/reset state.
    const categoryKey = categoryData.key ?? categoryData.category;

    if (activeCategory === categoryKey) {
      handleReset();
    } else {
      selectedItems = categoryData.items;
      activeCategory = categoryKey;
    }
  }

  function handleKeydown(event, categoryData) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectCategory(categoryData);
    }
  }
</script>

<div class="mirla-waffle-outer">
  {#if chartData.cells.length === 0}
    <ErrorState>NO DATA FOUND FOR KEY "{key}"</ErrorState>
  {:else}
    <div class="waffle-layout">
      <div
        class="waffle-grid"
        role="group"
        aria-label="Waffle chart grid"
        onmouseleave={() => (hoveredCategory = null)}
      >
        {#each chartData.cells as cell}
          <div
            role="button"
            tabindex="0"
            class="waffle-cell"
            style="background-color: {cell.color};"
            class:dimmed={(activeCategory && activeCategory !== cell.category) ||
              (hoveredCategory && hoveredCategory !== cell.category)}
            onclick={() => selectCategory(cell)}
            onkeydown={(event) => handleKeydown(event, cell)}
            onmouseenter={() => (hoveredCategory = cell.category)}
            aria-label="View {cell.category} items"
            title="{cell.category} ({cell.items.length})"
          ></div>
        {/each}

        {#if activeCategory}
          <ResetButton placement="waffle" onclick={handleReset} label="Reset waffle chart" />
        {/if}
      </div>

      <Legend
        items={chartData.legend}
        {activeCategory}
        {hoveredCategory}
        onSelect={selectCategory}
        onHover={(category) => (hoveredCategory = category)}
        onLeave={() => (hoveredCategory = null)}
      />
    </div>

    <ItemsBar items={selectedItems} {siteDomain} onclose={handleReset} />
  {/if}
</div>

<style>
  .mirla-waffle-outer {
    width: 100%;
    margin: var(--mirla-space-5xl, 2em) 0;
    font-family: var(--mirla-font-body, var(--pico-font-family, inherit));
    color: var(--mirla-text, var(--pico-color, inherit));
  }

  .waffle-layout {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--mirla-space-5xl, 2rem);
  }

  @media (min-width: 600px) {
    .waffle-layout {
      flex-direction: row;
      align-items: center;
      justify-content: center;
    }
  }

  .waffle-grid {
    position: relative;
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    gap: 3px;
    width: 100%;
    max-width: 350px;
    margin: 0;
    flex-shrink: 0;
  }

  .waffle-cell {
    aspect-ratio: 1;
    border-radius: 2px;
    cursor: pointer;
    transition: opacity var(--mirla-duration-fast, 0.2s), transform 0.1s;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
    outline: none;
  }

  .waffle-cell:focus-visible {
    box-shadow: 0 0 0 2px var(--mirla-primary, var(--pico-primary, #4a90e2));
  }

  .waffle-cell:hover {
    transform: scale(1.1);
    z-index: 2;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .dimmed {
    opacity: 0.2;
  }
</style>
