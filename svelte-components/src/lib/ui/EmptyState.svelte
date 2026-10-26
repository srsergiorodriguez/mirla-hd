<script>
  let {
    variant = 'table',
    spaced = false,
    children
  } = $props();
</script>

<div class="c-empty c-empty--{variant}" class:spaced>
  {@render children?.()}
</div>

<style>
  .c-empty {
    text-align: center;
    color: var(--mirla-text-muted, var(--pico-muted-color, #999));
  }

  .c-empty.spaced {
    margin: var(--mirla-space-2xl, 1em) 0;
  }

  /* Dense data tables. */
  .c-empty--table {
    padding: var(--mirla-space-7xl, 3rem);
    font-style: italic;
  }

  /* Inline galleries. */
  .c-empty--gallery {
    padding: var(--mirla-space-4xl, 1.5em);
    border: 1px dashed var(--pico-muted-border-color, #ccc);
    border-radius: var(--mirla-radius-md, var(--pico-border-radius, 8px));
    font-style: italic;
  }

  /* Chart / visualization no-data message. */
  .c-empty--viz {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100px;
    background: transparent;
    border: 1px dashed var(--pico-muted-border-color);
    border-radius: var(--mirla-radius-md, var(--pico-border-radius, 8px));
    font-family: monospace;
  }

  /* Larger dashed message (tree errors, component configuration hints). */
  .c-empty--message {
    padding: var(--mirla-space-5xl, 2rem);
    font-family: monospace;
    border: 1px dashed var(--pico-muted-border-color, #ccc);
    border-radius: var(--mirla-radius-md, var(--pico-border-radius, 8px));
  }
</style>
