<script>
  import ItemCard from './ItemCard.svelte';

  let {
    items = [],
    siteDomain = '',
    variant = 'index'
  } = $props();
</script>

<div class="c-item-grid c-item-grid--{variant}">
  {#each items as item (item.pid)}
    <ItemCard {item} {siteDomain} {variant} />
  {/each}
</div>

<style>
  .c-item-grid {
    display: grid;
  }

  .c-item-grid--index {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: var(--mirla-space-3xl, 1.2rem);
  }

  .c-item-grid--gallery {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: var(--mirla-space-4xl, 1.5rem);
  }

  .c-item-grid--compact {
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    gap: 10px;
  }
</style>
