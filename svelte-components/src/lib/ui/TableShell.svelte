<script>
  let {
    maxHeight = '500px',
    children
  } = $props();
</script>

<div class="c-table-shell" style:max-height={maxHeight}>
  {@render children?.()}
</div>

<style>
  .c-table-shell {
    overflow: auto;
    position: relative;
    border: 1px solid var(--mirla-border, color-mix(in srgb, var(--pico-color, currentColor) 20%, transparent));
    border-radius: var(--mirla-radius-md, var(--pico-border-radius, 8px));
    background: var(--mirla-surface, var(--pico-card-background-color, transparent));
  }
</style>
