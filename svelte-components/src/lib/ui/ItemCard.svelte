<script>
  import { getItemImage, getItemLabel } from '../data.js';

  let {
    item,
    siteDomain = '',
    variant = 'index'
  } = $props();

  const href = $derived(`${siteDomain}item/${item.pid}/index.html`);
  const label = $derived(getItemLabel(item));
  const image = $derived(
    variant === 'gallery'
      ? getItemImage(item, 0, { preferThumb: true })
      : getItemImage(item, 0)
  );
</script>

{#if variant === 'compact'}
  <a class="c-item-thumb" {href} title={label}>
    {#if image}
      <img src={image} alt={label} loading="lazy" />
    {:else}
      <div class="c-no-img"></div>
    {/if}
  </a>
{:else if variant === 'gallery'}
  <a class="c-gallery-item" {href}>
    <div class="c-image-wrapper">
      {#if image}
        <img src={image} alt={label} loading="lazy" />
      {:else}
        <div class="c-no-img">No Image</div>
      {/if}
    </div>
    <span class="c-item-label">{label}</span>
  </a>
{:else}
  <div class="c-preview-item">
    <a class="c-card-link" {href}>
      <div class="c-image-container">
        {#if image}
          <img src={image} alt={label} loading="lazy" />
        {:else}
          <div class="c-no-image-placeholder"></div>
        {/if}
      </div>
      <h3 class="c-item-title">{label}</h3>
    </a>
  </div>
{/if}

<style>
  .c-preview-item {
    transition: transform var(--mirla-duration-fast, 0.2s) ease;
  }

  .c-preview-item:hover {
    transform: translateY(-4px);
  }

  .c-card-link {
    text-decoration: none;
    color: var(--mirla-text, var(--pico-color, inherit));
    display: block;
  }

  .c-image-container {
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: var(--mirla-radius-md, var(--pico-border-radius, 8px));
    overflow: hidden;
    background: var(--mirla-border, color-mix(in srgb, var(--pico-color, currentColor) 20%, transparent));
    border: 1px solid var(--mirla-border, color-mix(in srgb, var(--pico-color, currentColor) 20%, transparent));
  }

  .c-image-container img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .c-no-image-placeholder {
    width: 100%;
    height: 100%;
    background-color: var(--pico-card-sectioning-background-color, rgba(0, 0, 0, 0.05));
  }

  .c-item-title {
    padding: var(--mirla-space-xl, 0.8rem) 0;
    margin: 0;
    font-size: var(--mirla-fs-base, 0.9rem);
    text-align: center;
    color: var(--mirla-heading, var(--pico-heading-color, inherit));
  }

  /* Gallery variant */
  .c-gallery-item {
    text-decoration: none;
    color: var(--mirla-text, var(--pico-color, inherit));
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .c-image-wrapper {
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: var(--mirla-radius-md, var(--pico-border-radius, 8px));
    overflow: hidden;
    background: var(--pico-muted-border-color, #eee);
    border: 1px solid var(--pico-form-element-border-color, rgba(0, 0, 0, 0.1));
    margin-bottom: var(--mirla-space-xl, 0.8em);
  }

  .c-image-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform var(--mirla-duration-fast, 0.2s) var(--mirla-ease-bounce, cubic-bezier(0.175, 0.885, 0.32, 1.275));
  }

  .c-gallery-item:hover img {
    transform: scale(1.03);
  }

  .c-item-label {
    font-size: 0.85em;
    font-weight: 600;
    text-align: center;
    line-height: 1.3;
    transition: color var(--mirla-duration-fast, 0.2s);
  }

  .c-gallery-item:hover .c-item-label {
    color: var(--mirla-primary-hover, var(--pico-primary-hover, inherit));
    text-decoration: underline;
  }

  .c-no-img {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8em;
    color: var(--mirla-text-muted, var(--pico-muted-color, #999));
  }

  /* Compact variant (ItemsBar) */
  .c-item-thumb {
    aspect-ratio: 1;
    border-radius: var(--mirla-radius-sm, var(--pico-border-radius, 4px));
    overflow: hidden;
    background: var(--pico-muted-border-color, #eee);
    display: block;
    transition: transform var(--mirla-duration-fast, 0.2s) var(--mirla-ease-bounce, cubic-bezier(0.175, 0.885, 0.32, 1.275));
  }

  .c-item-thumb:hover {
    transform: scale(1.1);
    z-index: 10;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  }

  .c-item-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .c-item-thumb .c-no-img {
    width: 100%;
    height: 100%;
  }
</style>
