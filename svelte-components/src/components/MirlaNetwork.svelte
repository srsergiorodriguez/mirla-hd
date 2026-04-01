<svelte:options customElement="mirla-network" />

<script>
  import { onMount, onDestroy, untrack } from 'svelte';
  import * as d3 from 'd3';
  import ItemsBar from "$lib/ItemsBar.svelte";

  let { 
    sourceKey = "", 
    targetKey = "", 
    color = "var(--pico-primary, #4a90e2)",
    accentSource = "var(--pico-primary, #4a90e2)",
    accentTarget = "var(--pico-secondary, #e06363)"
  } = $props();

  const collectionData = window.MIRLA_COLLECTION_DATA || { items: [] };
  const metadata = collectionData.items;
  const siteDomain = window.MIRLA_CONTEXT?.siteDomain || "";

  let canvasElement = $state();
  let resizeObserver;
  let selectedItems = $state([]); 
  let activeNodeId = $state(null);
  
  let simulation;
  let zoomBehavior;
  let currentTransform = d3.zoomIdentity;
  let hoveredNode = null;

  const splitValues = (val) => {
    if (val === null || val === undefined) return [];
    if (typeof val !== 'string') return [String(val)];
    return val.split(/[;,]+/).map(s => s.trim()).filter(s => s !== "");
  };

  let graph = $derived.by(() => {
    if (!sourceKey || !targetKey || metadata.length === 0) return { nodes: [], links: [] };
    const nodeMap = new Map();
    const links = [];
    metadata.forEach(item => {
      const sources = splitValues(item[sourceKey]);
      const targets = splitValues(item[targetKey]);
      sources.forEach(src => {
        if (!nodeMap.has(src)) nodeMap.set(src, { id: src, type: 'source', count: 0 });
        nodeMap.get(src).count++;
        targets.forEach(tgt => {
          if (!nodeMap.has(tgt)) nodeMap.set(tgt, { id: tgt, type: 'target', count: 0 });
          nodeMap.get(tgt).count++;
          links.push({ source: src, target: tgt });
        });
      });
    });
    return { nodes: Array.from(nodeMap.values()), links };
  });

  const radiusScale = d3.scaleSqrt().domain([1, 100]).range([4, 16]);

  function resolveColor(val, styles) {
    if (typeof val === 'string' && val.startsWith('var(')) {
      const match = val.match(/var\(([^,]+)(?:,\s*(.*))?\)/);
      if (match) {
        const cssVar = match[1].trim();
        const fallback = match[2] ? match[2].trim() : '#000';
        const computed = styles.getPropertyValue(cssVar).trim();
        return computed || fallback;
      }
    }
    return val;
  }

  function getActiveNeighbors() {
    if (!activeNodeId) return new Set();
    const neighbors = new Set([activeNodeId]);
    graph.links.forEach(l => {
      if (l.source.id === activeNodeId) neighbors.add(l.target.id);
      if (l.target.id === activeNodeId) neighbors.add(l.source.id);
    });
    return neighbors;
  }

  function draw() {
    if (!canvasElement) return;
    const ctx = canvasElement.getContext("2d");
    const width = canvasElement.clientWidth;
    const height = canvasElement.clientHeight;

    const styles = getComputedStyle(canvasElement);
    const textColor = styles.getPropertyValue('--pico-color').trim() || '#333';
    const bgColor = styles.getPropertyValue('--pico-background-color').trim() || '#fff';
    
    // Explicitly fetching the muted color for links as requested
    const linkColor = styles.getPropertyValue('--pico-muted-color').trim() || '#888';
    const activeLinkColor = styles.getPropertyValue('--pico-color').trim() || '#000';

    const resolvedSourceColor = resolveColor(accentSource, styles);
    const resolvedTargetColor = resolveColor(accentTarget, styles);

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.translate(currentTransform.x, currentTransform.y);
    ctx.scale(currentTransform.k, currentTransform.k);

    const neighbors = getActiveNeighbors();

    // 1. Draw Links
    ctx.lineWidth = 1;
    graph.links.forEach(d => {
      const isActive = activeNodeId && (d.source.id === activeNodeId || d.target.id === activeNodeId);
      ctx.beginPath();
      ctx.moveTo(d.source.x, d.source.y);
      ctx.lineTo(d.target.x, d.target.y);
      
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

    // 2. Draw Nodes
    graph.nodes.forEach(d => {
      const r = radiusScale(d.count);
      const isNeighbor = activeNodeId && neighbors.has(d.id);
      
      ctx.beginPath();
      ctx.arc(d.x, d.y, r, 0, 2 * Math.PI);
      
      ctx.fillStyle = d.type === 'source' ? resolvedSourceColor : resolvedTargetColor;
      ctx.globalAlpha = (!activeNodeId || isNeighbor) ? 1 : 0.2;
      ctx.fill();

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = bgColor;
      if (isNeighbor || d.id === activeNodeId) {
         ctx.lineWidth = 3; 
         ctx.strokeStyle = textColor;
      }
      ctx.stroke();
    });

    // 3. Draw Text Labels
    ctx.font = `11px ${styles.getPropertyValue('--pico-font-family').trim() || 'sans-serif'}`;
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    
    graph.nodes.forEach(d => {
      const isNeighbor = activeNodeId && neighbors.has(d.id);
      if (activeNodeId && !isNeighbor) return; 

      const r = radiusScale(d.count);
      ctx.globalAlpha = 1;
      
      ctx.lineWidth = 4;
      ctx.strokeStyle = bgColor;
      ctx.strokeText(d.id, d.x + r + 5, d.y);

      ctx.fillStyle = textColor;
      ctx.fillText(d.id, d.x + r + 5, d.y);
    });

    ctx.restore();
  }

  function fitToView(transitionDuration = 750) {
    if (!canvasElement || graph.nodes.length === 0) return;
    const width = canvasElement.clientWidth;
    const height = canvasElement.clientHeight;

    let minX = d3.min(graph.nodes, d => d.x);
    let maxX = d3.max(graph.nodes, d => d.x);
    let minY = d3.min(graph.nodes, d => d.y);
    let maxY = d3.max(graph.nodes, d => d.y);

    const graphWidth = maxX - minX;
    const graphHeight = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const padding = 0.7;
    const scale = Math.min(2, padding / Math.max(graphWidth / width, graphHeight / height));
    const transform = d3.zoomIdentity.translate(width / 2, height / 2).scale(scale).translate(-centerX, -centerY);
    
    if (transitionDuration > 0) {
      d3.select(canvasElement).transition().duration(transitionDuration)
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
    selectedItems = metadata.filter(item => {
      const vals = [...splitValues(item[sourceKey]), ...splitValues(item[targetKey])];
      return vals.includes(nodeId);
    });
    activeNodeId = nodeId;
    requestAnimationFrame(draw); // Just updates visuals, does NOT reset zoom!
  }

  function handleResize() {
    if (!canvasElement) return;
    const width = canvasElement.clientWidth;
    const height = canvasElement.clientHeight;
    const ratio = window.devicePixelRatio || 1;
    
    if (canvasElement.width !== width * ratio) {
      canvasElement.width = width * ratio;
      canvasElement.height = height * ratio;
      const ctx = canvasElement.getContext("2d");
      ctx.scale(ratio, ratio);
      
      if (simulation) {
        simulation.force("x", d3.forceX(width / 2).strength(0.15))
                  .force("y", d3.forceY(height / 2).strength(0.15));
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
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);

    radiusScale.domain([1, d3.max(graph.nodes, d => d.count)]);

    // The Ultimate Drag Offset Fix: 
    // Always fetch pointer relative to canvas, then invert to simulation space
    const dragBehavior = d3.drag()
      .subject((event) => {
        const [mx, my] = d3.pointer(event, canvas);
        const x = currentTransform.invertX(mx);
        const y = currentTransform.invertY(my);
        return simulation.find(x, y, 20); 
      })
      .on("start", (event) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on("drag", (event) => {
        const [mx, my] = d3.pointer(event, canvas);
        event.subject.fx = currentTransform.invertX(mx);
        event.subject.fy = currentTransform.invertY(my);
      })
      .on("end", (event) => {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      });

    zoomBehavior = d3.zoom()
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => {
        currentTransform = event.transform;
        draw();
      });

    const canvasSelection = d3.select(canvas);
    canvasSelection
      .call(dragBehavior)
      .call(zoomBehavior)
      .on("click", (event) => {
        const [mx, my] = d3.pointer(event, canvas);
        const x = currentTransform.invertX(mx);
        const y = currentTransform.invertY(my);
        const node = simulation.find(x, y, 15);
        if (node) filterNetwork(node.id);
      })
      .on("mousemove", (event) => {
        const [mx, my] = d3.pointer(event, canvas);
        const x = currentTransform.invertX(mx);
        const y = currentTransform.invertY(my);
        const node = simulation.find(x, y, 15);
        if (node !== hoveredNode) {
          hoveredNode = node;
          canvas.style.cursor = node ? "pointer" : "grab";
        }
      });

    simulation = d3.forceSimulation(graph.nodes)
      .force("link", d3.forceLink(graph.links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("x", d3.forceX(width / 2).strength(0.15))
      .force("y", d3.forceY(height / 2).strength(0.15))
      .force("collide", d3.forceCollide(d => radiusScale(d.count) + 5));

    simulation.on("tick", draw);

    for (let i = 0; i < 200; ++i) simulation.tick();
    fitToView(0);
  }

  onMount(() => {
    resizeObserver = new ResizeObserver(() => requestAnimationFrame(handleResize));
    resizeObserver.observe(canvasElement.parentElement);
  });
  
  onDestroy(() => { simulation?.stop(); resizeObserver?.disconnect(); });
  
  // The Zoom Reset Fix: `untrack` prevents Svelte from secretly tracking `activeNodeId`!
  $effect(() => { 
    graph; color; accentSource; accentTarget; 
    untrack(() => {
      initSimulation(); 
    });
  });
</script>

<div class="mirla-network-container">
  <div class="canvas-wrapper">
    <canvas bind:this={canvasElement}></canvas>
    {#if activeNodeId}
      <button class="reset-zoom-btn" onclick={handleReset} title="Fit All">↺</button>
    {/if}
  </div>
  <ItemsBar items={selectedItems} {siteDomain} onclose={handleReset} />
</div>

<style>
  .mirla-network-container { width: 100%; margin: 2em 0; position: relative; color: var(--pico-color, inherit); }
  .canvas-wrapper { width: 100%; height: 500px; position: relative; border-radius: 8px; }
  canvas { width: 100%; height: 100%; display: block; cursor: grab; }
  canvas:active { cursor: grabbing; }
  .reset-zoom-btn { position: absolute; top: 10px; left: 10px; background: var(--pico-card-background-color, rgba(255, 255, 255, 0.7)); border: 1px solid var(--pico-form-element-border-color, rgba(0,0,0,0.1)); border-radius: 50%; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: var(--pico-color, #555); z-index: 10; }
</style>