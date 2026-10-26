<script>
  import Button from './Button.svelte';

  let {
    page = 1,
    totalPages = 1,
    onPrev,
    onNext
  } = $props();
</script>

{#if totalPages > 1}
  <div class="c-pager">
    <Button
      variant="pager"
      disabled={page <= 1}
      onclick={onPrev}
      ariaLabel="Previous page"
    >«</Button>
    <div class="c-pager-numbers">{page} / {totalPages}</div>
    <Button
      variant="pager"
      disabled={page >= totalPages}
      onclick={onNext}
      ariaLabel="Next page"
    >»</Button>
  </div>
{/if}

<style>
  .c-pager {
    display: flex;
    justify-content: right;
    align-items: center;
    gap: var(--mirla-space-2xl, 1rem);
    margin: var(--mirla-space-5xl, 2rem) 0 var(--mirla-space-2xl, 1rem) 0;
  }

  .c-pager-numbers {
    font-size: var(--mirla-fs-base, 0.9rem);
    font-weight: 600;
  }
</style>
