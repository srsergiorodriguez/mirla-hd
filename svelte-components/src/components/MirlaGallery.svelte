<svelte:options customElement="mirla-gallery" />

<script>
  let { 
    key = "", 
    value = "",
    limit = "" 
  } = $props();

  const collectionData = window.MIRLA_COLLECTION_DATA || { items: [] };
  const items = collectionData.items;
  const siteDomain = window.MIRLA_CONTEXT?.siteDomain || "";

  // Reuse robust split for DH multi-value fields
  const splitValues = (val) => {
    if (val === null || val === undefined) return [];
    if (typeof val !== 'string') return [String(val)];
    return val.split(/[;,]+/).map(s => s.trim()).filter(s => s !== "");
  };

  let filteredItems = $derived.by(() => {
    if (!key || !value) return [];
    
    let matches = items.filter(item => {
      const vals = splitValues(item[key]);
      return vals.includes(value);
    });

    const max = parseInt(limit, 10);
    if (!isNaN(max) && max > 0) {
      matches = matches.slice(0, max);
    }
    return matches;
  });
</script>

<div class="mirla-gallery-container">
  {#if !key || !value}
    <div class="mirla-error">
      DEFINE 'KEY' AND 'VALUE' (e.g., key="Category" value="Art")
    </div>
  {:else if filteredItems.length === 0}
    <div class="mirla-empty">
      No items found for "{key}: {value}"
    </div>
  {:else}
    <div class="gallery-grid">
      {#each filteredItems as item (item.pid)}
        <a href="{siteDomain}/item/{item.pid}/index.html" class="gallery-item">
          <div class="image-wrapper">
            {#if item.images && item.images.length > 0}
              <img src={item.images[0]} alt={item.label || item.pid} loading="lazy" />
            {:else}
              <div class="no-img">No Image</div>
            {/if}
          </div>
          <span class="item-label">{item.label || item.pid}</span>
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  .mirla-gallery-container {
    width: 100%;
    margin: 2.5em 0;
    font-family: var(--pico-font-family, inherit);
  }

  .gallery-grid {
    display: grid;
    /* Adapts nicely to screen sizes, min width 140px for a clean masonry feel */
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1.5rem;
  }

  .gallery-item {
    text-decoration: none;
    color: var(--pico-color, inherit);
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .image-wrapper {
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: var(--pico-border-radius, 8px);
    overflow: hidden;
    background: var(--pico-muted-border-color, #eee);
    border: 1px solid var(--pico-form-element-border-color, rgba(0,0,0,0.1));
    margin-bottom: 0.8em;
  }

  .image-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    /* Exact match to the mirla-preview bouncy hover scale */
    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .gallery-item:hover img {
    transform: scale(1.03);
  }

  .item-label {
    font-size: 0.85em;
    font-weight: 600;
    text-align: center;
    line-height: 1.3;
    transition: color 0.2s;
  }

  .gallery-item:hover .item-label {
    color: var(--pico-primary-hover, inherit);
    text-decoration: underline;
  }

  .no-img {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8em;
    color: var(--pico-muted-color, #999);
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

  .mirla-empty {
    padding: 1.5em;
    text-align: center;
    color: var(--pico-muted-color, #999);
    border: 1px dashed var(--pico-muted-border-color, #ccc);
    border-radius: var(--pico-border-radius, 8px);
    font-style: italic;
  }
</style>