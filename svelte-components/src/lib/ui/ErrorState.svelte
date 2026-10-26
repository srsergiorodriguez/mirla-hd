<script>
  let {
    spaced = false,
    children
  } = $props();
</script>

<div class="c-error" class:spaced>
  {@render children?.()}
</div>

<style>
  .c-error {
    padding: var(--mirla-space-2xl, 1em);
    border: 1px dashed var(--mirla-danger, var(--pico-del-color, red));
    color: var(--mirla-danger, var(--pico-del-color, red));
    background: transparent;
    font-family: monospace;
    font-weight: bold;
    text-align: center;
    border-radius: var(--mirla-radius-md, var(--pico-border-radius, 8px));
  }

  .c-error.spaced {
    margin: var(--mirla-space-2xl, 1em) 0;
  }
</style>
