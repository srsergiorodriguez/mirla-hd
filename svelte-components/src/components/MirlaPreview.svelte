<svelte:options customElement="mirla-preview" />

<script>
  let { 
    pid = "", 
    title = "", 
    alt = "", 
    page = "1" 
  } = $props();

  const collectionData = window.MIRLA_COLLECTION_DATA || { items: [] };
  const items = collectionData.items;
  const siteDomain = window.MIRLA_CONTEXT?.siteDomain || "";

  let found = $derived(items.find(d => d.pid === pid));
  let imageIndex = $derived(Math.max(0, Number(page) - 1));
</script>

{#if found}
  <div class="mirla-preview-item">
    <a href="{siteDomain}/item/{pid}/index.html" class="img-link">
      {#if found.images && found.images[imageIndex]}
        <img 
          src={found.images[imageIndex]} 
          title={title || found.label || pid} 
          alt={alt || title || found.label || pid}
          loading="lazy"
        />
      {:else}
        <div class="no-image-placeholder">No image available</div>
      {/if}
    </a>
    
    <a class="silent-link" href="{siteDomain}/item/{pid}/index.html">
      {found.label || pid}
    </a>
    
    {#if title}
      <p class="custom-title"><em>{title}</em></p>
    {/if}
  </div>
{:else}
  <div class="mirla-error">
    INCORRECT: CHECK THE PID "{pid}"
  </div>
{/if}

<style>
  .mirla-preview-item {
    padding: 0.5em;
    /* PicoCSS variable integration */
    border: 1px solid var(--pico-form-element-border-color, rgba(0,0,0,0.15));
    border-radius: var(--pico-border-radius, 8px);
    background: var(--pico-card-background-color, transparent);
    box-shadow: var(--pico-card-box-shadow, none);
    color: var(--pico-color, inherit);
    font-family: var(--pico-font-family, inherit);
    
    max-width: 400px;
    margin: 1.5em auto;
    text-align: center;
  }

  .img-link {
    display: block;
    border-radius: calc(var(--pico-border-radius, 8px) / 2);
    overflow: hidden;
  }

  .mirla-preview-item img {
    width: 100%;
    height: auto;
    /* Added max height and contain to prevent distortion of tall images */
    max-height: 400px;
    object-fit: contain; 
    border-radius: calc(var(--pico-border-radius, 8px) / 2);
    display: block;
    
    /* Matched the transition style from ItemsBar for consistency */
    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .mirla-preview-item img:hover {
    transform: scale(1.03);
  }

  .silent-link {
    display: block;
    margin-top: 1em;
    font-weight: 600;
    color: var(--pico-color, inherit);
    text-decoration: none;
    transition: color 0.2s;
  }

  .silent-link:hover {
    color: var(--pico-primary-hover, inherit);
    text-decoration: underline;
  }

  .custom-title {
    margin-top: 0.5em;
    margin-bottom: 0;
    font-size: 0.9em;
    color: var(--pico-muted-color, #666);
  }

  .no-image-placeholder {
    width: 100%;
    aspect-ratio: 1;
    background: var(--pico-muted-border-color, #eee);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--pico-muted-color, #999);
    border-radius: calc(var(--pico-border-radius, 8px) / 2);
  }

  .mirla-error {
    padding: 1em;
    border: 1px dashed var(--pico-del-color, red);
    color: var(--pico-del-color, red);
    background: transparent;
    font-family: monospace;
    font-weight: bold;
    text-align: center;
    margin: 1em 0;
    border-radius: var(--pico-border-radius, 8px);
  }
</style>