<svelte:options customElement="mirla-compare" />

<script>
  let { 
    pid1 = "", 
    pid2 = "", 
    label1 = "Layer 1", 
    label2 = "Layer 2" 
  } = $props();

  const collectionData = window.MIRLA_COLLECTION_DATA || { items: [] };
  const items = collectionData.items;

  // Resolve Image 1 (Force String matching for safety)
  let resolvedImg1 = $derived.by(() => {
    if (!pid1) return null;
    const item = items.find(d => String(d.pid) === String(pid1));
    if (item && item.images && item.images.length > 0) return item.images[0];
    return null;
  });

  // Resolve Image 2
  let resolvedImg2 = $derived.by(() => {
    if (pid2) {
      const item = items.find(d => String(d.pid) === String(pid2));
      if (item && item.images && item.images.length > 0) return item.images[0];
    } else if (pid1) {
      const item = items.find(d => String(d.pid) === String(pid1));
      if (item && item.images && item.images.length > 1) return item.images[1];
    }
    return null;
  });

  let sliderValue = $state(50);
</script>

<div class="mirla-compare-container">
  {#if resolvedImg1 && resolvedImg2}
    <figure class="compare-figure">
      <img class="img-base" src={resolvedImg2} alt={label2} />

      <img 
        class="img-clip" 
        src={resolvedImg1} 
        alt={label1} 
        style="clip-path: inset(0 {100 - sliderValue}% 0 0);" 
      />

      <div class="slider-ui" style="left: {sliderValue}%;">
        <div class="slider-line"></div>
        <div class="slider-thumb" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>

      <div class="label label-left" style="opacity: {sliderValue > 15 ? 1 : 0};">{label1}</div>
      <div class="label label-right" style="opacity: {sliderValue < 85 ? 1 : 0};">{label2}</div>

      <input 
        type="range" 
        min="0" 
        max="100" 
        bind:value={sliderValue} 
        class="compare-range" 
        aria-label="Compare images slider"
      />
    </figure>
  {:else}
    <div class="mirla-error">
      PROVIDE 'PID1' (ITEM MUST HAVE 2 IMAGES) OR PROVIDE BOTH 'PID1' AND 'PID2'.
    </div>
  {/if}
</div>

<style>
  .mirla-compare-container {
    width: 100%;
    /* Centers the shrink-wrapped figure */
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 2em auto;
    font-family: var(--pico-font-family, inherit);
  }

  .compare-figure {
    position: relative;
    /* Shrink-wraps the container so the slider matches the image bounds perfectly */
    width: fit-content;
    max-width: 100%;
    margin: 0;
    padding: 0;
    border-radius: var(--pico-border-radius, 8px);
    overflow: hidden;
    background: var(--pico-muted-border-color, #eee);
    border: 1px solid var(--pico-form-element-border-color, rgba(0,0,0,0.1));
    line-height: 0; 
  }

  .img-base, .img-clip {
    display: block;
    pointer-events: none; 
  }

  .img-base {
    /* Enforces the 500px max height while keeping the native aspect ratio */
    max-width: 100%;
    max-height: 500px;
    width: auto;
    height: auto;
  }

  .img-clip {
    position: absolute;
    top: 0;
    left: 0;
    /* Forces the top image to exactly map onto the footprint of the base image */
    width: 100%;
    height: 100%;
    object-fit: fill; 
  }

  /* Slider UI overlay */
  .slider-ui {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    transform: translateX(-50%);
    pointer-events: none;
    z-index: 5;
  }

  .slider-line {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 2px;
    transform: translateX(-50%);
    background: white;
    box-shadow: 0 0 4px rgba(0,0,0,0.4);
  }

  .slider-thumb {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 36px;
    height: 36px;
    background: var(--pico-primary, #4a90e2);
    color: var(--pico-primary-inverse, white);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    border: 2px solid white;
  }

  /* Informational Labels */
  .label {
    position: absolute;
    top: 10px;
    padding: 4px 10px;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    font-size: 0.8rem;
    font-weight: bold;
    border-radius: var(--pico-border-radius, 4px);
    z-index: 4;
    transition: opacity 0.2s;
    line-height: 1.2;
    pointer-events: none;
    backdrop-filter: blur(2px);
  }

  .label-left { left: 10px; }
  .label-right { right: 10px; }

  /* Native Range Input (Invisible) */
  .compare-range {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    opacity: 0;
    cursor: col-resize;
    z-index: 10;
  }

  .mirla-error {
    padding: 1em;
    border: 1px dashed var(--pico-del-color, red);
    color: var(--pico-del-color, red);
    font-family: monospace;
    font-weight: bold;
    text-align: center;
    border-radius: var(--pico-border-radius, 8px);
  }
</style>