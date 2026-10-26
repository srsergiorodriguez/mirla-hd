<svelte:options customElement="mirla-timeline" />

<script>
  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';
  import ItemsBar from '$lib/ItemsBar.svelte';
  import { buildTimelineData, getCollection, getContext } from '$lib/data.js';
  import ResetButton from '$lib/ui/ResetButton.svelte';

  let {
    dateKey = '',
    color = 'var(--pico-primary, #4a90e2)',
    accent = 'var(--pico-secondary, #ffcc00)'
  } = $props();

  const collectionData = getCollection();
  const metadata = collectionData.items;
  const siteDomain = getContext().siteDomain;

  let svgElement = $state();
  let resizeObserver;
  let selectedItems = $state([]);
  let activeDateStr = $state(null);
  let zoomHandler;

  let timelineData = $derived(buildTimelineData(metadata, dateKey));

  function handleReset() {
    selectedItems = [];
    activeDateStr = null;

    if (svgElement) {
      const svg = d3.select(svgElement);
      svg
        .selectAll('circle')
        .transition()
        .duration(500)
        .attr('stroke-width', 1)
        .attr('fill', color)
        .attr('r', 8);

      if (zoomHandler) {
        svg
          .transition()
          .duration(500)
          .ease(d3.easeQuadOut)
          .call(zoomHandler.transform, d3.zoomIdentity);
      }
    }
  }

  function initTimeline() {
    if (!svgElement || timelineData.length === 0) return;

    const svg = d3.select(svgElement);
    svg.selectAll('*').remove();

    const width = svgElement.parentElement.clientWidth;
    const height = 100;
    const margin = { h: width * 0.05, v: height * 0.2 };

    svg.attr('viewBox', [0, 0, width, height]);

    const defs = svg.append('defs');
    defs
      .append('clipPath')
      .attr('id', 'clip-timeline')
      .append('rect')
      .attr('x', margin.h)
      .attr('y', 0)
      .attr('width', width - margin.h * 2)
      .attr('height', height);

    const x = d3
      .scaleTime()
      .domain(d3.extent(timelineData, (entry) => entry.date))
      .range([margin.h, width - margin.h])
      .nice();

    const xAxis = (group, scale) =>
      group
        .attr('transform', `translate(0, ${height * 0.7})`)
        .call(
          d3
            .axisBottom(scale)
            .tickFormat((date, index, ticks) => {
              const formatToYear = d3.timeFormat('%Y');
              const formatToMonth = d3.timeFormat('%m');
              if (index === 0) return formatToYear(date);
              const previousDate = ticks[index - 1].__data__;
              if (previousDate && previousDate.getFullYear() === date.getFullYear()) {
                return formatToMonth(date);
              }
              return formatToYear(date);
            })
        )
        .attr('font-size', null)
        .attr('font-family', null)
        .selectAll('.tick text')
        .attr('font-size', '0.8rem');

    const gx = svg.append('g').attr('class', 'axis');
    const g = svg.append('g').attr('clip-path', 'url(#clip-timeline)');
    const gDots = g.append('g').attr('class', 'dots-container');

    const dots = gDots
      .selectAll('circle')
      .data(timelineData)
      .join('circle')
      .attr('cy', height * 0.35)
      .attr('r', 8)
      .attr('fill', color)
      .attr('stroke', 'var(--pico-background-color, #fff)')
      .attr('stroke-width', 1)
      .attr('cursor', 'pointer')
      .on('click', function (event, entry) {
        selectedItems = entry.items;
        activeDateStr = entry.dateStr;

        gDots
          .selectAll('circle')
          .attr('stroke-width', 1)
          .attr('fill', color)
          .attr('r', 8);

        d3.select(this).attr('stroke-width', 2).attr('fill', accent).attr('r', 10);
      });

    zoomHandler = d3
      .zoom()
      .scaleExtent([1, 40])
      .on('zoom', ({ transform }) => {
        const zoomedX = transform.rescaleX(x);
        gx.call(xAxis, zoomedX);
        dots.attr('cx', (entry) => zoomedX(entry.date));
      });

    svg.call(zoomHandler);
    gx.call(xAxis, x);
    dots.attr('cx', (entry) => x(entry.date));
  }

  onMount(() => {
    resizeObserver = new ResizeObserver(() => requestAnimationFrame(initTimeline));
    if (svgElement?.parentElement) resizeObserver.observe(svgElement.parentElement);
  });

  onDestroy(() => resizeObserver?.disconnect());

  $effect(() => {
    timelineData;
    color;
    accent;
    initTimeline();
  });
</script>

<div class="mirla-timeline-outer">
  <div class="timeline-visual-area">
    <svg bind:this={svgElement}></svg>

    {#if activeDateStr}
      <ResetButton placement="top-right" onclick={handleReset} label="Reset timeline" />
    {/if}
  </div>

  <ItemsBar items={selectedItems} {siteDomain} onclose={handleReset} />
</div>

<style>
  .mirla-timeline-outer {
    width: 100%;
    margin: var(--mirla-space-5xl, 2em) 0;
    font-family: var(--mirla-font-body, var(--pico-font-family, inherit));
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

  svg:active {
    cursor: grabbing;
  }

  :global(mirla-timeline .axis path),
  :global(mirla-timeline .axis line) {
    stroke: var(--mirla-text-muted, var(--pico-muted-color, #ccc));
    stroke-linecap: round;
  }

  :global(mirla-timeline .axis text) {
    fill: var(--mirla-text, var(--pico-color, currentColor));
    font-family: var(--mirla-font-body, var(--pico-font-family, inherit));
    paint-order: stroke;
    stroke: var(--pico-background-color, white);
    stroke-width: 4px;
    stroke-opacity: 0.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
