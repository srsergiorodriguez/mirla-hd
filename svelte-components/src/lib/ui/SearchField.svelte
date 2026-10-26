<script>
  let {
    value = $bindable(''),
    placeholder = '',
    spacing = 'none',
    label = 'Search'
  } = $props();

  const inputId = $props.id();
</script>

<div class="c-search-wrap c-search-wrap--{spacing}">
  <input
    id={inputId}
    class="c-search"
    type="search"
    aria-label={label}
    {placeholder}
    bind:value
  />
</div>

<style>
  .c-search-wrap {
    display: flex;
    align-items: center;
  }

  .c-search-wrap--lg {
    margin-bottom: var(--mirla-space-4xl, 1.5rem);
  }

  .c-search-wrap--none {
    margin-bottom: 0;
  }

  .c-search {
    width: 100%;
    margin: 0;
    padding: var(--mirla-space-lg, 0.6rem) var(--mirla-space-3xl, 1.2rem);
    font-family: inherit;
    font-size: var(--mirla-fs-md, 1rem);
    color: var(--mirla-text, var(--pico-color, inherit));
    background-color: var(--sl-input-background-color, var(--pico-background-color, #fff));
    border: 1px solid var(--mirla-border, color-mix(in srgb, var(--pico-color, currentColor) 20%, transparent));
    border-radius: var(--mirla-radius-pill, 50px);
    outline: none;
    transition: border-color var(--mirla-duration-fast, 0.2s),
      box-shadow var(--mirla-duration-fast, 0.2s);
  }

  .c-search:focus {
    border-color: var(--mirla-primary, var(--pico-primary, #3498db));
    box-shadow: 0 0 0 calc(var(--pico-outline-width, 3px) / 2)
      var(--mirla-focus-ring, var(--sl-focus-ring-color, rgba(52, 152, 219, 0.2)));
  }
</style>
