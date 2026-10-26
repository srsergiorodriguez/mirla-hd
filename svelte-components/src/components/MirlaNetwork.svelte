<svelte:options customElement="mirla-network" />

<script>
  import { onMount, onDestroy, untrack } from 'svelte';
  import * as d3 from 'd3';
  import ItemsBar from '$lib/ItemsBar.svelte';
  import {
    buildNetworkData,
    getCollection,
    getContext,
    splitValues
  } from '$lib/data.js';
  import ResetButton from '$lib/ui/ResetButton.svelte';

  let {
    sourceKey = '',
    targetKey = '',
    color = 'var(--pico-primary, #4a90e2)',
    accentSource = 'var(--pico-primary, #4a90e2)',
    accentTarget = 'var(--pico-secondary, #e06363)'
  } = $props();

  const collectionData = getCollection();
  const metadata = collectionData.items;
  const siteDomain = getContext().siteDomain;

  let canvasElement = $state();
  let resizeObserver;
  let selectedItems = $state([]);
  let activeNodeId = $state(null);

  let simulation;
  let zoomBehavior;
  let currentTransform = d3.zoomIdentity;
  let hoveredNode = null;

  let graph = $derived(buildNetworkData(metadata, sourceKey, targetKey));

  const radiusScale = d3.scaleSqrt().domain([1, 100]).range([4, 16]);

  function resolveColor(value, styles) {
    if (typeof value === 'string' && value.startsWith('var(')) {
      const match = value.match(/var\(([^,]+)(?:,\s*(.*))?\)/);
      if (match) {
        const cssVar = match[1].trim();
        const fallback = match[2] ? match[2].trim() : '#000';
        const computed = styles.getPropertyValue(cssVar).trim();
        return computed || fallback;
      }
    }
    return value;
  }

  function getActiveNeighbors() {
    if (!activeNodeId) return new Set();
    const neighbors = new Set([activeNodeId]);
    graph.links.forEach((link) => {
      if (link.source.id === activeNodeId) neighbors.add(link.target.id);
      if (link.target.id === activeNodeId) neighbors.add(link.source.id);
    });
    return neighbors;
  }

  function draw() {
    if (!canvasElement) return;
    const ctx = canvasElement.getContext('2d');
    const width = canvasElement.clientWidth;
    const height = canvasElement.clientHeight;

    const styles = getComputedStyle(canvasElement);
    const textColor = styles.getPropertyValue('--pico-color').trim() || '#333';
    const bgColor = styles.getPropertyValue('--pico-background-color').trim() || '#fff';

    const linkColor = styles.getPropertyValue('--pico-muted-color').trim() || '#888';
    const activeLinkColor = styles.getPropertyValue('--pico-color').trim() || '#000';

    const resolvedSourceColor = resolveColor(accentSource, styles);
    const resolvedTargetColor = resolveColor(accentTarget, styles);

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.translate(currentTransform.x, currentTransform.y);
    ctx.scale(currentTransform.k, currentTransform.k);

    const neighbors = getActiveNeighbors();

    ctx.lineWidth = 1;
    graph.links.forEach((link) => {
      const isActive =
        activeNodeId && (link.source.id === activeNodeId || link.target.id === activeNodeId);
      ctx.beginPath();
      ctx.moveTo(link.source.x, link.source.y);
      ctx.lineTo(link.target.x, link.target.y);

      if (!activeNodeId) {
        ctx.strokeStyle = linkColor;
        ctx.globalAlpha = 0.6;
      } else if (isActive) {
        ctx.strokeStyle = activeLinkColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1;
      } else {
        ctx.strokeStyle = linkColor;
        ctx.globalAlpha = 0.1;
      }
      ctx.stroke();
    });

    graph.nodes.forEach((node) => {
      const radius = radiusScale(node.count);
      const isNeighbor = activeNodeId && neighbors.has(node.id);

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);

      ctx.fillStyle = node.type === 'source' ? resolvedSourceColor : resolvedTargetColor;
      ctx.globalAlpha = !activeNodeId || isNeighbor ? 1 : 0.2;
      ctx.fill();

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = bgColor;
      if (isNeighbor || node.id === activeNodeId) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = textColor;
      }
      ctx.stroke();
    });

    ctx.font = `11px ${styles.getPropertyValue('--pico-font-family').trim() || 'sans-serif'}`;
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';

    graph.nodes.forEach((node) => {
      const isNeighbor = activeNodeId && neighbors.has(node.id);
      if (activeNodeId && !isNeighbor) return;

      const radius = radiusScale(node.count);
      ctx.globalAlpha = 1;

      ctx.lineWidth = 4;
      ctx.strokeStyle = bgColor;
      ctx.strokeText(node.id, node.x + radius + 5, node.y);

      ctx.fillStyle = textColor;
      ctx.fillText(node.id, node.x + radius + 5, node.y);
    });

    ctx.restore();
  }

  function fitToView(transitionDuration = 750) {
    if (!canvasElement || graph.nodes.length === 0) return;
    const width = canvasElement.clientWidth;
    const height = canvasElement.clientHeight;

    let minX = d3.min(graph.nodes, (node) => node.x);
    let maxX = d3.max(graph.nodes, (node) => node.x);
    let minY = d3.min(graph.nodes, (node) => node.y);
    let maxY = d3.max(graph.nodes, (node) => node.y);

    const graphWidth = maxX - minX;
    const graphHeight = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const padding = 0.7;
    const scale = Math.min(
      2,
      padding / Math.max(graphWidth / width, graphHeight / height)
    );
    const transform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(scale)
      .translate(-centerX, -centerY);

    if (transitionDuration > 0) {
      d3.select(canvasElement)
        .transition()
        .duration(transitionDuration)
        .call(zoomBehavior.transform, transform);
    } else {
      d3.select(canvasElement).call(zoomBehavior.transform, transform);
    }
  }

  function handleReset() {
    selectedItems = [];
    activeNodeId = null;
    fitToView(750);
    requestAnimationFrame(draw);
  }

  function filterNetwork(nodeId) {
    selectedItems = metadata.filter((item) => {
      const values = [...splitValues(item[sourceKey]), ...splitValues(item[targetKey])];
      return values.includes(nodeId);
    });
    activeNodeId = nodeId;
    requestAnimationFrame(draw);
  }

  function handleResize() {
    if (!canvasElement) return;
    const width = canvasElement.clientWidth;
    const height = canvasElement.clientHeight;
    const ratio = window.devicePixelRatio || 1;

    if (canvasElement.width !== width * ratio) {
      canvasElement.width = width * ratio;
      canvasElement.height = height * ratio;
      const ctx = canvasElement.getContext('2d');
      ctx.scale(ratio, ratio);

      if (simulation) {
        simulation
          .force('x', d3.forceX(width / 2).strength(0.15))
          .force('y', d3.forceY(height / 2).strength(0.15));
        simulation.alpha(0.1).restart();
      }
      requestAnimationFrame(draw);
    }
  }

  function initSimulation() {
    if (!canvasElement || graph.nodes.length === 0) return;
    if (simulation) simulation.stop();

    const canvas = canvasElement;
    const width = canvas.clientWidth;
    const height = 500;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);

    radiusScale.domain([1, d3.max(graph.nodes, (node) => node.count)]);

    const dragBehavior = d3
      .drag()
      .subject((event) => {
        const [mouseX, mouseY] = d3.pointer(event, canvas);
        const x = currentTransform.invertX(mouseX);
        const y = currentTransform.invertY(mouseY);
        return simulation.find(x, y, 20);
      })
      .on('start', (event) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on('drag', (event) => {
        const [mouseX, mouseY] = d3.pointer(event, canvas);
        event.subject.fx = currentTransform.invertX(mouseX);
        event.subject.fy = currentTransform.invertY(mouseY);
      })
      .on('end', (event) => {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      });

    zoomBehavior = d3
      .zoom()
      .scaleExtent([0.1, 8])
      .on('zoom', (event) => {
        currentTransform = event.transform;
        draw();
      });

    const canvasSelection = d3.select(canvas);
    canvasSelection
      .call(dragBehavior)
      .call(zoomBehavior)
      .on('click', (event) => {
        const [mouseX, mouseY] = d3.pointer(event, canvas);
        const x = currentTransform.invertX(mouseX);
        const y = currentTransform.invertY(mouseY);
        const node = simulation.find(x, y, 15);
        if (node) filterNetwork(node.id);
      })
      .on('mousemove', (event) => {
        const [mouseX, mouseY] = d3.pointer(event, canvas);
        const x = currentTransform.invertX(mouseX);
        const y = currentTransform.invertY(mouseY);
        const node = simulation.find(x, y, 15);
        if (node !== hoveredNode) {
          hoveredNode = node;
          canvas.style.cursor = node ? 'pointer' : 'grab';
        }
      });

    simulation = d3
      .forceSimulation(graph.nodes)
      .force('link', d3.forceLink(graph.links).id((node) => node.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('x', d3.forceX(width / 2).strength(0.15))
      .force('y', d3.forceY(height / 2).strength(0.15))
      .force('collide', d3.forceCollide((node) => radiusScale(node.count) + 5));

    simulation.on('tick', draw);

    for (let i = 0; i < 200; ++i) simulation.tick();
    fitToView(0);
  }

  onMount(() => {
    resizeObserver = new ResizeObserver(() => requestAnimationFrame(handleResize));
    resizeObserver.observe(canvasElement.parentElement);
  });

  onDestroy(() => {
    simulation?.stop();
    resizeObserver?.disconnect();
  });

  $effect(() => {
    graph;
    color;
    accentSource;
    accentTarget;
    untrack(() => {
      initSimulation();
    });
  });
</script>

<div class="mirla-network-container">
  <div class="canvas-wrapper">
    <canvas bind:this={canvasElement}></canvas>
    {#if activeNodeId}
      <ResetButton placement="inset-left" onclick={handleReset} label="Reset network" title="Fit All" />
    {/if}
  </div>
  <ItemsBar items={selectedItems} {siteDomain} onclose={handleReset} />
</div>

<style>
  .mirla-network-container {
    width: 100%;
    margin: var(--mirla-space-5xl, 2em) 0;
    position: relative;
    color: var(--mirla-text, var(--pico-color, inherit));
  }

  .canvas-wrapper {
    width: 100%;
    height: 500px;
    position: relative;
    border-radius: var(--mirla-radius-md, 8px);
  }

  canvas {
    width: 100%;
    height: 100%;
    display: block;
    cursor: grab;
  }

  canvas:active {
    cursor: grabbing;
  }
</style>
