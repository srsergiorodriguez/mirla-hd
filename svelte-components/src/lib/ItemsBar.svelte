<script>
  import { fade } from 'svelte/transition';
  let { items = [], siteDomain = "", onclose } = $props();

  // Pull translations from the global context with a safe fallback
  const i18n = window.MIRLA_CONTEXT?.i18n || {
    resultsFound: "results found"
  };
</script>

{#if items.length > 0}
  <div class="mirla-items-bar" transition:fade={{ duration: 300 }}>
    <div class="items-bar-header">
      <span><strong>{items.length}</strong> {i18n.resultsFound}</span>
      <button onclick={onclose} aria-label="Close items bar">×</button>
    </div>
    <div class="items-grid">
      {#each items as item}
        <a href="{siteDomain}/item/{item.pid}/index.html" class="item-thumb">
          {#if item.images && item.images[0]}
            <img src={item.images[0]} alt={item.label} title={item.label} loading="lazy" />
          {:else}
            <div class="no-img"></div>
          {/if}
        </a>
      {/each}
    </div>
  </div>
{/if}

<style>
  .mirla-items-bar {
    border: 1px solid var(--pico-form-element-border-color, rgba(0, 0, 0, 0.1));
    border-radius: var(--pico-border-radius, 8px);
    padding: 1rem;
    margin-top: 1rem;
    max-height: 240px;
    overflow-y: auto;
    background: var(--pico-card-background-color, #ffffff);
    box-shadow: var(--pico-card-box-shadow, 0 2px 4px rgba(0,0,0,0.05));
  }

  .items-bar-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.8rem;
    font-size: 0.85rem;
    color: var(--pico-muted-color, #666);
  }

  .items-bar-header button {
    border: none;
    background: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: var(--pico-color, #999);
    line-height: 1;
    padding: 0 0.5rem;
  }

  .items-bar-header button:hover {
    color: var(--pico-primary-hover, #000);
  }

  .items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    gap: 10px;
  }

  .item-thumb {
    aspect-ratio: 1;
    border-radius: var(--pico-border-radius, 4px);
    overflow: hidden;
    background: var(--pico-muted-border-color, #eee);
    display: block;
    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .item-thumb:hover {
    transform: scale(1.1);
    z-index: 10;
    box-shadow: 0 4px 10px rgba(0,0,0,0.15);
  }

  .item-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .no-img { width: 100%; height: 100%; }
</style>