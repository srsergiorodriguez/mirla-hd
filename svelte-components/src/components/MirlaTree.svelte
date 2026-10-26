<svelte:options customElement="mirla-tree" />

<script>
  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';
  import ItemsBar from '$lib/ItemsBar.svelte';
  import {
    buildTreeData,
    getCollection,
    getContext,
    getItemsForTreeNode
  } from '$lib/data.js';
  import EmptyState from '$lib/ui/EmptyState.svelte';

  let {
    keys = '',
    color = 'var(--pico-primary, #4a90e2)',
    accent = 'var(--pico-secondary, #ffcc00)'
  } = $props();

  const collectionData = getCollection();
  const metadata = collectionData.items;
  const siteDomain = getContext().siteDomain;

  let svgElement = $state();
  let resizeObserver;
  let selectedItems = $state([]);
  let activeNodeId = $state(null);

  let treeRoot = $derived.by(() => {
    const data = buildTreeData(metadata, keys);
    return data ? d3.hierarchy(data).count() : null;
  });

  let leafCount = $derived(treeRoot ? treeRoot.leaves().length : 0);
  let chartHeight = $derived(Math.max(300, leafCount * 30));

  function handleReset() {
    selectedItems = [];
    activeNodeId = null;
    if (svgElement) {
      d3.select(svgElement)
        .selectAll('circle')
        .transition()
        .duration(500)
        .attr('fill', color)
        .attr('stroke-width', 1)
        .attr('r', 6);
    }
  }

  function getItemsForNode(node) {
    return getItemsForTreeNode(metadata, node, keys);
  }

  function drawTree() {
    if (!svgElement || !treeRoot) return;

    const svg = d3.select(svgElement);
    svg.selectAll('*').remove();

    const rect = svgElement.parentElement.getBoundingClientRect();
    const width = rect.width;
    const height = chartHeight;
    const margin = { top: 20, right: 120, bottom: 20, left: 60 };

    svg.attr('viewBox', [0, 0, width, height]);

    const treeLayout = d3
      .tree()
      .size([height - margin.top - margin.bottom, width - margin.left - margin.right]);
    treeLayout(treeRoot);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g')
      .attr('fill', 'none')
      .attr('stroke', 'var(--pico-muted-color, #888)')
      .attr('stroke-width', 1.5)
      .attr('stroke-linecap', 'round')
      .selectAll('path')
      .data(treeRoot.links())
      .join('path')
      .attr('d', d3.linkHorizontal().x((entry) => entry.y).y((entry) => entry.x));

    const node = g
      .append('g')
      .selectAll('g')
      .data(treeRoot.descendants())
      .join('g')
      .attr('transform', (entry) => `translate(${entry.y},${entry.x})`)
      .style('cursor', 'pointer')
      .on('click', function (event, entry) {
        selectedItems = getItemsForNode(entry);
        activeNodeId = entry.data.name + entry.depth;

        g.selectAll('circle').attr('fill', color).attr('stroke-width', 1).attr('r', 6);

        d3.select(this).select('circle').attr('fill', accent).attr('stroke-width', 2).attr('r', 8);
      });

    node
      .append('circle')
      .attr('fill', (entry) =>
        activeNodeId === entry.data.name + entry.depth ? accent : color
      )
      .attr('stroke', 'var(--pico-background-color, #fff)')
      .attr('stroke-width', (entry) =>
        activeNodeId === entry.data.name + entry.depth ? 2 : 1
      )
      .attr('r', (entry) => (activeNodeId === entry.data.name + entry.depth ? 8 : 6));

    node
      .append('text')
      .attr('dy', '0.31em')
      .attr('x', (entry) => (entry.children ? -12 : 12))
      .attr('text-anchor', (entry) => (entry.children ? 'end' : 'start'))
      .text((entry) => (entry.data.name === 'Root' ? '' : entry.data.name))
      .attr('fill', 'var(--pico-color, currentColor)')
      .attr('paint-order', 'stroke')
      .attr('stroke', 'var(--pico-background-color, white)')
      .attr('stroke-width', 4)
      .attr('stroke-opacity', 0.6)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round');
  }

  onMount(() => {
    resizeObserver = new ResizeObserver(() => requestAnimationFrame(drawTree));
    if (svgElement?.parentElement) resizeObserver.observe(svgElement.parentElement);
  });

  onDestroy(() => resizeObserver?.disconnect());

  $effect(() => {
    treeRoot;
    color;
    accent;
    drawTree();
  });
</script>

<div class="mirla-tree-container">
  <div class="svg-wrapper" style="height: {chartHeight}px;">
    {#if !keys}
      <EmptyState variant="message">
        Define 'keys' attribute (e.g., keys="Category,Year")
      </EmptyState>
    {:else}
      <svg bind:this={svgElement}></svg>
    {/if}
  </div>

  <ItemsBar items={selectedItems} {siteDomain} onclose={handleReset} />
</div>

<style>
  .mirla-tree-container {
    width: 100%;
    margin: var(--mirla-space-5xl, 2em) 0;
    overflow: visible;
    font-family: var(--mirla-font-body, var(--pico-font-family, inherit));
    color: var(--mirla-text, var(--pico-color, inherit));
  }

  .svg-wrapper {
    width: 100%;
    overflow: visible;
  }

  svg {
    width: 100%;
    height: 100%;
    display: block;
  }

  :global(mirla-tree svg text) {
    font-family: var(--mirla-font-body, var(--pico-font-family, inherit));
    font-size: 0.85rem;
    pointer-events: none;
  }
</style>
