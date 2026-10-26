<script>
  let {
    count,
    suffix = '',
    children
  } = $props();
</script>

<div class="c-status-bar">
  <span><strong>{count}</strong> {suffix}</span>
  <div class="c-status-actions">
    {@render children?.()}
  </div>
</div>

<style>
  .c-status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: var(--mirla-fs-base, 0.9rem);
    border-top: 1px solid var(--mirla-border, color-mix(in srgb, var(--pico-color, currentColor) 20%, transparent));
    padding-top: var(--mirla-space-2xl, 1rem);
    margin-top: var(--mirla-space-2xl, 1rem);
  }

  .c-status-actions {
    display: flex;
    align-items: center;
    gap: var(--mirla-space-md, 0.5rem);
  }
</style>
