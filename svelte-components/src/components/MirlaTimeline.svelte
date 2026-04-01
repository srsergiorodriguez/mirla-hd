<svelte:options customElement="mirla-timeline" />

<script>
  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';
  import ItemsBar from "$lib/ItemsBar.svelte";

  // 1. Props with PicoCSS defaults
  let { 
    dateKey = "", 
    color = "var(--pico-primary, #4a90e2)", 
    accent = "var(--pico-secondary, #ffcc00)" 
  } = $props();

  const collectionData = window.MIRLA_COLLECTION_DATA || { items: [] };
  const metadata = collectionData.items;
  const siteDomain = window.MIRLA_CONTEXT?.siteDomain || "";

  let svgElement = $state();
  let resizeObserver;
  let selectedItems = $state([]);
  let activeDateStr = $state(null);
  let zoomHandler;

  function parseMirlaDate(val) {
    if (!val) return null;
    if ((typeof val === 'number' && val > 1000 && val < 2100) || 
        (typeof val === 'string' && /^\d{4}$/.test(val))) {
      return new Date(parseInt(val), 0, 1);
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  let timelineData = $derived.by(() => {
    if (!dateKey || metadata.length === 0) return [];
    const groups = d3.group(metadata, d => d[dateKey]);
    return Array.from(groups, ([dateStr, data]) => ({
      date: parseMirlaDate(dateStr),
      dateStr: dateStr,
      items: data
    })).filter(d => d.date !== null)
       .sort((a, b) => d3.ascending(a.date, b.date));
  });

  function handleReset() {
    selectedItems = [];
    activeDateStr = null;
    if (svgElement) {
      const svg = d3.select(svgElement);
      svg.selectAll("circle")
        .transition()
        .duration(500)
        .attr("stroke-width", 1)
        .attr("fill", color)
        .attr("r", 8);

      if (zoomHandler) {
        svg.transition()
          .duration(500)
          .ease(d3.easeQuadOut)
          .call(zoomHandler.transform, d3.zoomIdentity);
      }
    }
  }

  function initTimeline() {
    if (!svgElement || timelineData.length === 0) return;

    const svg = d3.select(svgElement);
    svg.selectAll("*").remove();

    const width = svgElement.parentElement.clientWidth;
    const height = 100;
    const margin = { h: width * 0.05, v: height * 0.2 };

    svg.attr("viewBox", [0, 0, width, height]);

    // Masking Definition to constrain shapes inside the timeline boundaries
    const defs = svg.append("defs");
    defs.append("clipPath")
      .attr("id", "clip-timeline")
      .append("rect")
      .attr("x", margin.h)
      .attr("y", 0)
      .attr("width", width - (margin.h * 2))
      .attr("height", height);

    const x = d3.scaleTime()
      .domain(d3.extent(timelineData, d => d.date))
      .range([margin.h, width - margin.h])
      .nice();

    // Stripped D3 formatting and applied exact font sizes
    const xAxis = (g, scale) => g
      .attr("transform", `translate(0, ${height * 0.7})`)
      .call(d3.axisBottom(scale)
        .tickFormat((d, index, ticks) => {
          const formatToYear = d3.timeFormat("%Y");
          const formatToMonth = d3.timeFormat("%m");
          if (index === 0) return formatToYear(d);
          const prevDate = ticks[index - 1].__data__;
          if (prevDate && prevDate.getFullYear() === d.getFullYear()) {
            return formatToMonth(d);
          }
          return formatToYear(d);
        })
      )
      .attr("font-size", null)
      .attr("font-family", null)
      .selectAll(".tick text")
      .attr("font-size", "0.8rem");

    const gx = svg.append("g").attr("class", "axis");
    const g = svg.append("g").attr("clip-path", "url(#clip-timeline)");
    const gDots = g.append("g").attr("class", "dots-container");

    const dots = gDots.selectAll("circle")
      .data(timelineData)
      .join("circle")
        .attr("cy", height * 0.35)
        .attr("r", 8)
        .attr("fill", color)
        .attr("stroke", "var(--pico-background-color, #fff)") // Use background as stroke for a cutout effect
        .attr("stroke-width", 1)
        .attr("cursor", "pointer")
        .on("click", function(event, d) {
          selectedItems = d.items;
          activeDateStr = d.dateStr;
          
          gDots.selectAll("circle")
            .attr("stroke-width", 1)
            .attr("fill", color)
            .attr("r", 8);
          
          d3.select(this)
            .attr("stroke-width", 2)
            .attr("fill", accent)
            .attr("r", 10); // Slightly enlarge the active dot
        });

    zoomHandler = d3.zoom()
      .scaleExtent([1, 40])
      .on("zoom", ({transform}) => {
        const zx = transform.rescaleX(x);
        gx.call(xAxis, zx);
        dots.attr("cx", d => zx(d.date));
      });

    svg.call(zoomHandler);
    gx.call(xAxis, x);
    dots.attr("cx", d => x(d.date));
  }

  onMount(() => {
    resizeObserver = new ResizeObserver(() => requestAnimationFrame(initTimeline));
    resizeObserver.observe(svgElement.parentElement);
  });

  onDestroy(() => resizeObserver?.disconnect());
  $effect(() => { timelineData; color; accent; initTimeline(); });
</script>

<div class="mirla-timeline-outer">
  <div class="timeline-visual-area">
    <svg bind:this={svgElement}></svg>
    
    {#if activeDateStr}
      <button class="reset-viz-btn" onclick={handleReset} title="Reset">↺</button>
    {/if}
  </div>

  <ItemsBar 
    items={selectedItems} 
    {siteDomain} 
    onclose={handleReset} 
  />
</div>

<style>
  .mirla-timeline-outer {
    width: 100%;
    margin: 2em 0;
    font-family: var(--pico-font-family, inherit);
  }

  .timeline-visual-area {
    position: relative;
    width: 100%;
  }

  svg {
    width: 100%;
    height: 100px;
    display: block;
    cursor: grab;
    overflow: visible;
  }

  svg:active { cursor: grabbing; }

  /* Match the barchart reset button styling and placement */
  .reset-viz-btn {
    position: absolute;
    top: 0px;
    right: 0px;
    background: var(--pico-card-background-color, rgba(255, 255, 255, 0.7));
    border: 1px solid var(--pico-form-element-border-color, rgba(0,0,0,0.1));
    border-radius: 50%;
    width: 32px;
    height: 32px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    color: var(--pico-color, #555);
    z-index: 10;
  }

  /* Typography and Theme Adapting */
  :global(mirla-timeline .axis path),
  :global(mirla-timeline .axis line) {
    stroke: var(--pico-muted-color, #ccc);
    stroke-linecap: round;
  }

  :global(mirla-timeline .axis text) {
    fill: var(--pico-color, currentColor); 
    font-family: var(--pico-font-family, inherit);
    paint-order: stroke;
    stroke: var(--pico-background-color, white); /* Halo matching the page background */
    stroke-width: 4px;
    stroke-opacity: 0.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>