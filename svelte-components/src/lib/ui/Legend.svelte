<script>
  let {
    items = [],
    activeCategory = null,
    hoveredCategory = null,
    onSelect,
    onHover,
    onLeave
  } = $props();

  function handleKeydown(event, item) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.(item);
    }
  }
</script>

<div class="c-legend" role="list">
  {#each items as item}
    <div
      role="button"
      tabindex="0"
      class="c-legend-item"
      class:dimmed={(activeCategory && activeCategory !== item.key) ||
        (hoveredCategory && hoveredCategory !== item.key)}
      onclick={() => onSelect?.(item)}
      onkeydown={(event) => handleKeydown(event, item)}
      onmouseenter={() => onHover?.(item.key)}
      onmouseleave={() => onLeave?.()}
      aria-label="Filter by {item.key}"
    >
      <span class="c-legend-color" style="background-color: {item.color};" aria-hidden="true"></span>
      <span class="c-legend-label">{item.key} <small>({item.count})</small></span>
    </div>
  {/each}
</div>

<style>
  .c-legend {
    display: flex;
    flex-direction: column;
    gap: var(--mirla-space-md, 0.5rem);
  }

  .c-legend-item {
    display: flex;
    align-items: center;
    gap: var(--mirla-space-md, 0.5rem);
    cursor: pointer;
    font-size: var(--mirla-fs-sm, 0.85rem);
    transition: opacity var(--mirla-duration-fast, 0.2s);
    outline: none;
  }

  .c-legend-item:focus-visible {
    outline: 2px solid var(--mirla-primary, var(--pico-primary, #4a90e2));
    border-radius: 2px;
  }

  .c-legend-item:hover .c-legend-label {
    text-decoration: underline;
  }

  .c-legend-color {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .c-legend-label {
    line-height: 1.2;
  }

  .c-legend-label small {
    color: var(--mirla-text-muted, var(--pico-muted-color, #888));
  }

  .dimmed {
    opacity: 0.2;
  }
</style>
