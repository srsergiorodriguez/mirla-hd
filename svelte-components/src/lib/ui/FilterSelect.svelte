<script>
  let {
    label,
    value = $bindable(),
    options = [],
    allLabel = '- All -'
  } = $props();

  const selectId = $props.id();
</script>

<div class="c-filter-group">
  <label for={selectId}>{label}</label>
  <select id={selectId} class="c-filter-select" bind:value>
    <option value="">{allLabel}</option>
    {#each options as option}
      <option value={option}>{option}</option>
    {/each}
  </select>
</div>

<style>
  .c-filter-group {
    display: flex;
    flex-direction: column;
  }

  .c-filter-group label {
    font-size: var(--mirla-fs-sm, 0.85rem);
    font-weight: 600;
    margin-bottom: var(--mirla-space-sm, 0.4rem);
    text-transform: capitalize;
    color: var(--mirla-text-muted, var(--pico-muted-color, #777));
  }

  .c-filter-select {
    margin: 0;
    padding: var(--mirla-space-md, 0.5rem) var(--mirla-space-xl, 0.8rem);
    font-family: inherit;
    font-size: var(--mirla-fs-base, 0.9rem);
    color: var(--mirla-text, var(--pico-color, inherit));
    background-color: var(--sl-input-background-color, var(--pico-background-color, #fff));
    border: 1px solid var(--mirla-border, color-mix(in srgb, var(--pico-color, currentColor) 20%, transparent));
    border-radius: var(--mirla-radius-md, var(--pico-border-radius, 8px));
    outline: none;
    transition: border-color var(--mirla-duration-fast, 0.2s),
      box-shadow var(--mirla-duration-fast, 0.2s);
  }

  .c-filter-select:focus {
    border-color: var(--mirla-primary, var(--pico-primary, #3498db));
    box-shadow: 0 0 0 calc(var(--pico-outline-width, 3px) / 2)
      var(--mirla-focus-ring, var(--sl-focus-ring-color, rgba(52, 152, 219, 0.2)));
  }
</style>
