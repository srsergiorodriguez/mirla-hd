<svelte:options customElement="mirla-preview" />

<script>
  import { getCollection, getContext, getItemByPid, getItemImage, getItemLabel } from '$lib/data.js';
  import ErrorState from '$lib/ui/ErrorState.svelte';

  let {
    pid = '',
    title = '',
    alt = '',
    page = '1'
  } = $props();

  const collectionData = getCollection();
  const items = collectionData.items;
  const siteDomain = getContext().siteDomain;

  let found = $derived(getItemByPid(items, pid));
  let imageIndex = $derived(Math.max(0, Number(page) - 1));
  let label = $derived(getItemLabel(found));
  let image = $derived(found ? getItemImage(found, imageIndex) : null);
</script>

{#if found}
  <div class="mirla-preview-item">
    <a href="{siteDomain}item/{pid}/index.html" class="img-link">
      {#if image}
        <img
          src={image}
          title={title || label}
          alt={alt || title || label}
          loading="lazy"
        />
      {:else}
        <div class="no-image-placeholder">No image available</div>
      {/if}
    </a>

    <a class="silent-link" href="{siteDomain}item/{pid}/index.html">
      {label}
    </a>

    {#if title}
      <p class="custom-title"><em>{title}</em></p>
    {/if}
  </div>
{:else}
  <ErrorState spaced>INCORRECT: CHECK THE PID "{pid}"</ErrorState>
{/if}

<style>
  .mirla-preview-item {
    padding: var(--mirla-space-md, 0.5em);
    border: 1px solid var(--mirla-border-form, var(--pico-form-element-border-color, rgba(0, 0, 0, 0.15)));
    border-radius: var(--mirla-radius-md, var(--pico-border-radius, 8px));
    background: var(--mirla-surface, var(--pico-card-background-color, transparent));
    box-shadow: var(--pico-card-box-shadow, none);
    color: var(--mirla-text, var(--pico-color, inherit));
    font-family: var(--mirla-font-body, var(--pico-font-family, inherit));
    max-width: 400px;
    margin: var(--mirla-space-4xl, 1.5em) auto;
    text-align: center;
  }

  .img-link {
    display: block;
    border-radius: calc(var(--mirla-radius-md, var(--pico-border-radius, 8px)) / 2);
    overflow: hidden;
  }

  .mirla-preview-item img {
    width: 100%;
    height: auto;
    max-height: 400px;
    object-fit: contain;
    border-radius: calc(var(--mirla-radius-md, var(--pico-border-radius, 8px)) / 2);
    display: block;
    transition: transform var(--mirla-duration-fast, 0.2s) var(--mirla-ease-bounce, cubic-bezier(0.175, 0.885, 0.32, 1.275));
  }

  .mirla-preview-item img:hover {
    transform: scale(1.03);
  }

  .silent-link {
    display: block;
    margin-top: var(--mirla-space-2xl, 1em);
    font-weight: 600;
    color: var(--mirla-text, var(--pico-color, inherit));
    text-decoration: none;
    transition: color var(--mirla-duration-fast, 0.2s);
  }

  .silent-link:hover {
    color: var(--mirla-primary-hover, var(--pico-primary-hover, inherit));
    text-decoration: underline;
  }

  .custom-title {
    margin-top: var(--mirla-space-md, 0.5em);
    margin-bottom: 0;
    font-size: 0.9em;
    color: var(--mirla-text-muted, var(--pico-muted-color, #666));
  }

  .no-image-placeholder {
    width: 100%;
    aspect-ratio: 1;
    background: var(--pico-muted-border-color, #eee);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--mirla-text-muted, var(--pico-muted-color, #999));
    border-radius: calc(var(--mirla-radius-md, var(--pico-border-radius, 8px)) / 2);
  }
</style>
