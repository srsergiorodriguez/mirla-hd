<script>
  let {
    children,
    padding = 'lg',
    tone = 'card'
  } = $props();
</script>

<div class="c-surface c-surface--{padding} c-surface--{tone}">
  {@render children?.()}
</div>

<style>
  .c-surface {
    background: var(--mirla-surface, var(--pico-card-background-color, #f8f9fa));
    border: 1px solid var(--mirla-border, color-mix(in srgb, var(--pico-color, currentColor) 20%, transparent));
    border-radius: var(--mirla-radius-md, var(--pico-border-radius, 8px));
    box-shadow: var(--mirla-shadow, var(--pico-box-shadow, 0 2px 4px rgba(0, 0, 0, 0.1)));
  }

  .c-surface--lg {
    padding: var(--mirla-space-4xl, 1.5rem);
    margin-bottom: var(--mirla-space-5xl, 2rem);
  }

  .c-surface--md {
    padding: var(--mirla-space-2xl, 1rem);
  }

  .c-surface--card {
    color: var(--mirla-text, var(--pico-color, inherit));
  }
</style>
