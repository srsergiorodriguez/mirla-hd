<svelte:options customElement="mirla-map" />

<script>
  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';
  import * as topojson from 'topojson-client';
  import ItemsBar from "$lib/ItemsBar.svelte";

  let { 
    coordKey = "latlong", 
    color = "var(--pico-primary, #4a90e2)",
    accent = "var(--pico-secondary, #ffcc00)"
  } = $props();

  const collectionData = window.MIRLA_COLLECTION_DATA || { items: [] };
  const metadata = collectionData.items;
  const siteDomain = window.MIRLA_CONTEXT?.siteDomain || "";

  let svgElement = $state();
  let resizeObserver;
  let selectedItems = $state([]); 
  let activeCoordId = $state(null);
  let zoomHandler;
  
  // Cache the map geometry so we only download it once
  let worldCountries = $state(null);

  let mapData = $derived.by(() => {
    if (!coordKey || metadata.length === 0) return [];
    
    const validItems = metadata.filter(d => {
      const val = d[coordKey];
      if (!val || typeof val !== 'string') return false;
      const parts = val.split(',');
      if (parts.length !== 2) return false;
      
      const lat = parseFloat(parts[0]);
      const lon = parseFloat(parts[1]);
      return !isNaN(lat) && !isNaN(lon);
    });

    const groups = d3.group(validItems, d => {
      const parts = d[coordKey].split(',');
      return `${parseFloat(parts[0]).toFixed(4)},${parseFloat(parts[1]).toFixed(4)}`;
    });
    
    return Array.from(groups, ([coordId, items]) => {
      const parts = items[0][coordKey].split(',');
      const lat = parseFloat(parts[0]);
      const lon = parseFloat(parts[1]);
      return { coordId, lat, lon, items, count: items.length };
    });
  });

  function handleReset() {
    selectedItems = [];
    activeCoordId = null;
    if (svgElement) {
      d3.select(svgElement).selectAll(".map-marker")
        .transition().duration(300)
        .attr("fill", color)
        .attr("stroke-width", 1.5)
        .attr("r", d => d3.scaleSqrt().domain([1, d3.max(mapData, m => m.count)]).range([4, 12])(d.count));
      
      if (zoomHandler) {
        d3.select(svgElement).transition().duration(750)
          .call(zoomHandler.transform, d3.zoomIdentity);
      }
    }
  }

  // Now fully synchronous! No more duplicate maps.
  function drawMap() {
    if (!svgElement || !worldCountries) return;

    const svg = d3.select(svgElement);
    svg.selectAll("*").remove();

    const width = svgElement.parentElement.clientWidth;
    const height = 400;

    svg.attr("viewBox", [0, 0, width, height]);

    const projection = d3.geoNaturalEarth1().fitSize([width, height], worldCountries);
    const path = d3.geoPath(projection);

    const g = svg.append("g");

    // Landmass styles using PicoCSS variables
    g.selectAll("path")
      .data(worldCountries.features)
      .join("path")
      .attr("d", path)
      .attr("fill", "var(--pico-muted-color, #ccc)")
      .attr("fill-opacity", 0.3) // Makes the landmass subtle but highly visible
      .attr("stroke", "var(--pico-background-color, #ffffff)")
      .attr("stroke-width", 0.5);

    const radiusScale = d3.scaleSqrt()
      .domain([1, d3.max(mapData, d => d.count) || 1])
      .range([4, 12]);

    const markers = g.selectAll("circle")
      .data(mapData)
      .join("circle")
      .attr("class", "map-marker")
      .attr("cx", d => projection([d.lon, d.lat])[0])
      .attr("cy", d => projection([d.lon, d.lat])[1])
      .attr("r", d => radiusScale(d.count))
      .attr("fill", d => (activeCoordId === d.coordId) ? accent : color)
      .attr("stroke", "var(--pico-background-color, #ffffff)")
      .attr("stroke-width", d => (activeCoordId === d.coordId) ? 3 : 1.5)
      .style("cursor", "pointer")
      .on("click", function(event, d) {
        selectedItems = d.items;
        activeCoordId = d.coordId;

        g.selectAll(".map-marker")
          .transition().duration(200)
          .attr("fill", color)
          .attr("stroke-width", 1.5)
          .attr("r", m => radiusScale(m.count));

        d3.select(this)
          .transition().duration(200)
          .attr("fill", accent)
          .attr("stroke-width", 3)
          .attr("r", radiusScale(d.count) + 4); 
          
        const [x, y] = projection([d.lon, d.lat]);
        svg.transition().duration(750).call(
          zoomHandler.transform, 
          d3.zoomIdentity.translate(width / 2, height / 2).scale(3).translate(-x, -y)
        );
      });

    zoomHandler = d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        markers.attr("r", d => (radiusScale(d.count) + (activeCoordId === d.coordId ? 4 : 0)) / event.transform.k)
               .attr("stroke-width", d => ((activeCoordId === d.coordId) ? 3 : 1.5) / event.transform.k);
      });

    svg.call(zoomHandler);
  }

  onMount(() => {
    // 1. Fetch map data ONCE on mount
    d3.json("https://unpkg.com/world-atlas@2.0.2/countries-110m.json").then(data => {
      worldCountries = topojson.feature(data, data.objects.countries);
      requestAnimationFrame(drawMap);
    });

    // 2. Setup resize observer
    resizeObserver = new ResizeObserver(() => requestAnimationFrame(drawMap));
    if (svgElement?.parentElement) resizeObserver.observe(svgElement.parentElement);
  });

  onDestroy(() => resizeObserver?.disconnect());
  
  // React to data changes only if the map geometry is ready
  $effect(() => { 
    mapData; color; accent; 
    if (worldCountries) drawMap(); 
  });
</script>

<div class="mirla-map-outer">
  <div class="map-visual-area">
    {#if mapData.length === 0}
      <div class="mirla-empty">No valid geographic coordinates found.</div>
    {/if}
    <svg bind:this={svgElement}></svg>
    
    {#if activeCoordId}
      <button class="reset-viz-btn" onclick={handleReset} title="Reset Map">↺</button>
    {/if}
  </div>

  <ItemsBar 
    items={selectedItems} 
    {siteDomain} 
    onclose={handleReset} 
  />
</div>

<style>
  .mirla-map-outer {
    width: 100%;
    margin: 2em 0;
    font-family: var(--pico-font-family, inherit);
  }

  .map-visual-area {
    position: relative;
    width: 100%;
    border-radius: var(--pico-border-radius, 8px);
    border: 1px solid var(--pico-form-element-border-color, rgba(0,0,0,0.1));
    background: var(--pico-card-background-color, transparent);
    overflow: hidden;
  }

  svg {
    width: 100%;
    height: 400px; 
    display: block;
    cursor: grab;
  }
  
  svg:active { cursor: grabbing; }

  .mirla-empty {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: var(--pico-muted-color, #999);
    font-style: italic;
  }

  .reset-viz-btn {
    position: absolute;
    top: 10px;
    right: 10px;
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
</style>