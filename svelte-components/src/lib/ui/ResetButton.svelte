<script>
  let {
    placement = 'top-right',
    onclick,
    label = 'Reset',
    title = 'Reset'
  } = $props();
</script>

<button
  type="button"
  class="c-reset c-reset--{placement}"
  aria-label={label}
  {title}
  {onclick}
>↺</button>

<style>
  .c-reset {
    position: absolute;
    width: 32px;
    height: 32px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--mirla-surface, var(--pico-card-background-color, rgba(255, 255, 255, 0.7)));
    border: 1px solid var(--pico-form-element-border-color, rgba(0, 0, 0, 0.1));
    border-radius: 50%;
    font-family: inherit;
    font-size: var(--mirla-fs-lg, 1.2rem);
    color: var(--mirla-text, var(--pico-color, #555));
    cursor: pointer;
    outline: none;
    z-index: 10;
    transition: box-shadow var(--mirla-duration-fast, 0.2s);
  }

  .c-reset:focus-visible {
    box-shadow: 0 0 0 calc(var(--pico-outline-width, 3px) / 2)
      var(--mirla-focus-ring, var(--sl-focus-ring-color, rgba(52, 152, 219, 0.2)));
  }

  .c-reset--top-right {
    top: 0;
    right: 0;
  }

  .c-reset--inset-right {
    top: 10px;
    right: 10px;
  }

  .c-reset--inset-left {
    top: 10px;
    left: 10px;
  }

  .c-reset--waffle {
    top: -12px;
    right: -12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
</style>
