<svelte:options customElement="mirla-barchart" />

<script>
  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';
  import ItemsBar from '$lib/ItemsBar.svelte';
  import { getCollection, getContext, groupCounts } from '$lib/data.js';
  import { colorForIndex } from '$lib/palette.js';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import ResetButton from '$lib/ui/ResetButton.svelte';

  let {
    key = '',
    top = '10',
    color = 'var(--pico-primary, #4a90e2)',
    usePalette = 'false'
  } = $props();

  const collectionData = getCollection();
  const metadata = collectionData.items;
  const siteDomain = getContext().siteDomain;

  let svgElement = $state();
  let resizeObserver;
  let selectedItems = $state([]);
  let activeCategory = $state(null);

  let chartData = $derived.by(() => {
    let groups = groupCounts(metadata, key);

    const topN = parseInt(top, 10);
    if (!Number.isNaN(topN) && topN > 0) groups = groups.slice(0, topN);

    return groups;
  });

  let chartHeight = $derived(chartData.length > 0 ? chartData.length * 45 + 60 : 200);

  function handleReset() {
    selectedItems = [];
    activeCategory = null;
    if (svgElement) {
      d3.select(svgElement).selectAll('rect').transition().duration(300).attr('opacity', 1);
    }
  }

  function drawChart() {
    if (!svgElement || chartData.length === 0) return;

    const svg = d3.select(svgElement);
    svg.selectAll('*').remove();

    const width = svgElement.parentElement.clientWidth;
    const height = chartHeight;

    svg.attr('viewBox', [0, 0, width, height]);
    const margin = { top: 20, right: 40, bottom: 40, left: 150 };

    svg
      .append('defs')
      .append('clipPath')
      .attr('id', 'mirla-bar-clip')
      .append('rect')
      .attr('x', margin.left)
      .attr('y', 0)
      .attr('width', width - margin.left - margin.right + 20)
      .attr('height', height);

    const x = d3
      .scaleLinear()
      .domain([0, d3.max(chartData, (entry) => entry.count)])
      .range([margin.left, width - margin.right])
      .nice();

    const y = d3
      .scaleBand()
      .domain(chartData.map((entry) => entry.key))
      .range([margin.top, height - margin.bottom])
      .padding(0.25);

    const xAxis = (group) =>
      group
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(Math.max(width / 80, 2)).tickSizeOuter(0))
        .attr('font-family', null)
        .selectAll('.tick text')
        .attr('font-size', '0.8rem')
        .call((selection) => selection.select('.domain').remove());

    const yAxis = (group) =>
      group
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickSizeOuter(0))
        .attr('font-size', null)
        .attr('font-family', null)
        .selectAll('.tick text')
        .attr('font-size', '0.8rem')
        .call(wrapText, margin.left - 15);

    svg
      .append('g')
      .attr('clip-path', 'url(#mirla-bar-clip)')
      .selectAll('rect')
      .data(chartData)
      .join('rect')
      .attr('x', x(0))
      .attr('y', (entry) => y(entry.key))
      .attr('width', (entry) => Math.max(0, x(entry.count) - x(0)))
      .attr('height', y.bandwidth())
      .attr('rx', 6)
      .attr('fill', (entry, index) => (usePalette === 'true' ? colorForIndex(index) : color))
      .attr('opacity', (entry) =>
        activeCategory === null || activeCategory === entry.key ? 1 : 0.3
      )
      .style('cursor', 'pointer')
      .on('click', (event, entry) => {
        activeCategory = entry.key;
        selectedItems = entry.items;
        svg
          .selectAll('rect')
          .transition()
          .duration(300)
          .attr('opacity', (rectData) => (rectData.key === entry.key ? 1 : 0.3));
      })
      .on('mouseenter', function () {
        if (!activeCategory) d3.select(this).attr('opacity', 0.8);
      })
      .on('mouseleave', function () {
        if (!activeCategory) d3.select(this).attr('opacity', 1);
      });

    svg.append('g').attr('class', 'axis x-axis').call(xAxis);
    svg.append('g').attr('class', 'axis y-axis').call(yAxis);
  }

  function wrapText(text, width) {
    text.each(function () {
      let textNode = d3.select(this);
      let words = textNode.text().split(/\s+/).reverse();
      let word;
      let line = [];
      let lineNumber = 0;
      const lineHeight = 1.2;
      const y = textNode.attr('y');
      const dy = parseFloat(textNode.attr('dy') || 0.32);
      let tspan = textNode
        .text(null)
        .append('tspan')
        .attr('x', -12)
        .attr('y', y)
        .attr('dy', dy + 'em');

      while ((word = words.pop())) {
        line.push(word);
        tspan.text(line.join(' '));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(' '));
          line = [word];
          tspan = textNode
            .append('tspan')
            .attr('x', -12)
            .attr('y', y)
            .attr('dy', ++lineNumber * lineHeight + dy + 'em')
            .text(word);
        }
      }
    });
  }

  onMount(() => {
    resizeObserver = new ResizeObserver(() => requestAnimationFrame(drawChart));
    if (svgElement?.parentElement) resizeObserver.observe(svgElement.parentElement);
  });

  onDestroy(() => resizeObserver?.disconnect());

  $effect(() => {
    chartData;
    color;
    usePalette;
    drawChart();
  });
</script>

<div class="mirla-barchart-outer">
  {#if chartData.length === 0}
    <EmptyState variant="viz">No data found for key "{key}"</EmptyState>
  {:else}
    <div class="visual-area" style="height: {chartHeight}px;">
      <svg bind:this={svgElement}></svg>
      {#if activeCategory}
        <ResetButton placement="top-right" onclick={handleReset} label="Reset chart" />
      {/if}
    </div>

    <ItemsBar items={selectedItems} {siteDomain} onclose={handleReset} />
  {/if}
</div>

<style>
  .mirla-barchart-outer {
    width: 100%;
    margin: var(--mirla-space-5xl, 2em) 0;
    font-family: var(--mirla-font-body, var(--pico-font-family, inherit));
    position: relative;
  }

  .visual-area {
    position: relative;
    width: 100%;
  }

  svg {
    width: 100%;
    height: 100%;
    overflow: visible;
    display: block;
  }

  :global(mirla-barchart svg text) {
    font-family: var(--mirla-font-body, var(--pico-font-family, inherit));
    font-size: 0.9rem;
    fill: var(--mirla-text, var(--pico-color, currentColor));
  }

  :global(mirla-barchart .axis path),
  :global(mirla-barchart .axis line) {
    stroke: var(--mirla-text-muted, var(--pico-muted-color, #ccc));
  }
</style>
