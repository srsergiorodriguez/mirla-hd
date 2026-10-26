<script>
  import { fade } from 'svelte/transition';
  import { getI18n } from './data.js';
  import Button from './ui/Button.svelte';
  import ItemGrid from './ui/ItemGrid.svelte';

  let {
    items = [],
    siteDomain = '',
    onclose
  } = $props();

  const i18n = getI18n(globalThis, {
    resultsFound: 'results found'
  });
</script>

{#if items.length > 0}
  <div class="mirla-items-bar" transition:fade={{ duration: 300 }}>
    <div class="items-bar-header">
      <span><strong>{items.length}</strong> {i18n.resultsFound}</span>
      <Button variant="plain" onclick={onclose} ariaLabel="Close items bar">×</Button>
    </div>

    <ItemGrid {items} {siteDomain} variant="compact" />
  </div>
{/if}

<style>
  .mirla-items-bar {
    border: 1px solid var(--mirla-border-form, var(--pico-form-element-border-color, rgba(0, 0, 0, 0.1)));
    border-radius: var(--mirla-radius-md, var(--pico-border-radius, 8px));
    padding: var(--mirla-space-2xl, 1rem);
    margin-top: var(--mirla-space-2xl, 1rem);
    max-height: 240px;
    overflow-y: auto;
    background: var(--mirla-surface, var(--pico-card-background-color, #fff));
    box-shadow: var(--mirla-shadow-card, var(--pico-card-box-shadow, 0 2px 4px rgba(0, 0, 0, 0.05)));
  }

  .items-bar-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--mirla-space-xl, 0.8rem);
    font-size: var(--mirla-fs-sm, 0.85rem);
    color: var(--mirla-text-muted, var(--pico-muted-color, #666));
  }
</style>
