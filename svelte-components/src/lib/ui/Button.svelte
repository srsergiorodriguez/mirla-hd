<script>
  let {
    variant = 'ghost',
    size = 'md',
    type = 'button',
    title = '',
    ariaLabel = '',
    disabled = false,
    onclick,
    children
  } = $props();
</script>

<button
  {type}
  class="c-button c-button--{variant} c-button--{size}"
  {title}
  aria-label={ariaLabel || title}
  {disabled}
  {onclick}
>
  {@render children?.()}
</button>

<style>
  .c-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--mirla-space-sm, 0.4rem);
    margin: 0;
    font-family: inherit;
    cursor: pointer;
    outline: none;
    transition: border-color var(--mirla-duration-fast, 0.2s),
      color var(--mirla-duration-fast, 0.2s),
      background-color var(--mirla-duration-fast, 0.2s),
      box-shadow var(--mirla-duration-fast, 0.2s);
  }

  .c-button:focus {
    box-shadow: 0 0 0 calc(var(--pico-outline-width, 3px) / 2)
      var(--mirla-focus-ring, var(--sl-focus-ring-color, rgba(52, 152, 219, 0.2)));
  }

  .c-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Ghost: transparent pill with a border. */
  .c-button--ghost {
    background-color: transparent;
    color: var(--mirla-text, var(--pico-color, inherit));
    border: 1px solid var(--mirla-border, color-mix(in srgb, var(--pico-color, currentColor) 20%, transparent));
    border-radius: var(--mirla-radius-pill, 50px);
  }

  .c-button--ghost:hover:not(:disabled) {
    border-color: var(--mirla-primary, var(--pico-primary, #3498db));
    color: var(--mirla-primary, var(--pico-primary, #3498db));
  }

  .c-button--ghost.c-button--sm {
    padding: var(--mirla-space-3xs, 0.2rem) var(--mirla-space-xl, 0.8rem);
    font-size: var(--mirla-fs-lg, 1.2rem);
    line-height: 1;
  }

  .c-button--ghost.c-button--md {
    padding: var(--mirla-space-xs, 0.3rem) var(--mirla-space-2xl, 1rem);
    font-size: var(--mirla-fs-sm, 0.85rem);
    font-weight: 600;
    line-height: 1.2;
  }

  /* Primary: used by the CSV action. */
  .c-button--primary {
    padding: var(--mirla-space-sm, 0.4rem) var(--mirla-space-3xl, 1.2rem);
    font-size: var(--mirla-fs-base, 0.9rem);
    font-weight: bold;
    background-color: var(--mirla-primary, var(--pico-primary, #3498db));
    color: var(--mirla-on-primary, var(--pico-primary-inverse, #fff));
    border: 1px solid var(--mirla-primary, var(--pico-primary, #3498db));
    border-radius: var(--mirla-radius-pill, 50px);
  }

  .c-button--primary:hover:not(:disabled) {
    background-color: var(--mirla-primary-hover, var(--pico-primary-hover, #2980b9));
    border-color: var(--mirla-primary-hover, var(--pico-primary-hover, #2980b9));
  }

  /* Icon: circular, square footprint. */
  .c-button--icon {
    width: 32px;
    height: 32px;
    padding: 0;
    background: var(--mirla-surface, var(--pico-card-background-color, rgba(255, 255, 255, 0.7)));
    border: 1px solid var(--pico-form-element-border-color, rgba(0, 0, 0, 0.1));
    border-radius: 50%;
    font-size: var(--mirla-fs-lg, 1.2rem);
    color: var(--mirla-text, var(--pico-color, #555));
    z-index: 10;
  }

  /* Plain: menu-bar close button. */
  .c-button--plain {
    padding: 0 var(--mirla-space-md, 0.5rem);
    border: none;
    background: none;
    font-size: var(--mirla-fs-lg, 1.2rem);
    line-height: 1;
    color: var(--pico-color, #999);
  }

  .c-button--plain:hover:not(:disabled) {
    color: var(--mirla-primary-hover, var(--pico-primary-hover, #000));
  }

  /* Pager: ghost-like arrows. */
  .c-button--pager {
    width: auto;
    padding: var(--mirla-space-2xs, 0.25rem) var(--mirla-space-2xl, 1rem);
    font-size: var(--mirla-fs-sm, 0.85rem);
    line-height: 1.5;
    background-color: transparent;
    color: var(--mirla-text, var(--pico-color, inherit));
    border: 1px solid var(--mirla-border, color-mix(in srgb, var(--pico-color, currentColor) 20%, transparent));
    border-radius: var(--mirla-radius-pill, 50px);
  }

  .c-button--pager:hover:not(:disabled) {
    background-color: var(--mirla-primary, var(--pico-primary, #3498db));
    color: var(--mirla-on-primary, var(--pico-primary-inverse, #fff));
    border-color: var(--mirla-primary, var(--pico-primary, #3498db));
  }

  .c-button svg {
    width: 14px;
    height: 14px;
  }
</style>
