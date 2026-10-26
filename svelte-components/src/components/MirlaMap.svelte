<svelte:options customElement="mirla-map" />

<script>
  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';
  import * as topojson from 'topojson-client';
  import ItemsBar from '$lib/ItemsBar.svelte';
  import { buildMapData, getCollection, getContext } from '$lib/data.js';
  import ResetButton from '$lib/ui/ResetButton.svelte';

  let {
    coordKey = 'latlong',
    color = 'var(--pico-primary, #4a90e2)',
    accent = 'var(--pico-secondary, #ffcc00)'
  } = $props();

  const collectionData = getCollection();
  const metadata = collectionData.items;
  const siteDomain = getContext().siteDomain;

  let svgElement = $state();
  let resizeObserver;
  let selectedItems = $state([]);
  let activeCoordId = $state(null);
  let zoomHandler;
  let worldCountries = $state(null);

  let mapData = $derived(buildMapData(metadata, coordKey));

  function handleReset() {
    selectedItems = [];
    activeCoordId = null;

    if (svgElement) {
      d3.select(svgElement)
        .selectAll('.map-marker')
        .transition()
        .duration(300)
        .attr('fill', color)
        .attr('stroke-width', 1.5)
        .attr('r', (entry) =>
          d3
            .scaleSqrt()
            .domain([1, d3.max(mapData, (point) => point.count)])
            .range([4, 12])(entry.count)
        );

      if (zoomHandler) {
        d3.select(svgElement)
          .transition()
          .duration(750)
          .call(zoomHandler.transform, d3.zoomIdentity);
      }
    }
  }

  function drawMap() {
    if (!svgElement || !worldCountries) return;

    const svg = d3.select(svgElement);
    svg.selectAll('*').remove();

    const width = svgElement.parentElement.clientWidth;
    const height = 400;

    svg.attr('viewBox', [0, 0, width, height]);

    const projection = d3.geoNaturalEarth1().fitSize([width, height], worldCountries);
    const path = d3.geoPath(projection);

    const g = svg.append('g');

    g.selectAll('path')
      .data(worldCountries.features)
      .join('path')
      .attr('d', path)
      .attr('fill', 'var(--pico-muted-color, #ccc)')
      .attr('fill-opacity', 0.3)
      .attr('stroke', 'var(--pico-background-color, #ffffff)')
      .attr('stroke-width', 0.5);

    const radiusScale = d3
      .scaleSqrt()
      .domain([1, d3.max(mapData, (point) => point.count) || 1])
      .range([4, 12]);

    const markers = g
      .selectAll('circle')
      .data(mapData)
      .join('circle')
      .attr('class', 'map-marker')
      .attr('cx', (point) => projection([point.lon, point.lat])[0])
      .attr('cy', (point) => projection([point.lon, point.lat])[1])
      .attr('r', (point) => radiusScale(point.count))
      .attr('fill', (point) => (activeCoordId === point.coordId ? accent : color))
      .attr('stroke', 'var(--pico-background-color, #ffffff)')
      .attr('stroke-width', (point) => (activeCoordId === point.coordId ? 3 : 1.5))
      .style('cursor', 'pointer')
      .on('click', function (event, point) {
        selectedItems = point.items;
        activeCoordId = point.coordId;

        g.selectAll('.map-marker')
          .transition()
          .duration(200)
          .attr('fill', color)
          .attr('stroke-width', 1.5)
          .attr('r', (marker) => radiusScale(marker.count));

        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill', accent)
          .attr('stroke-width', 3)
          .attr('r', radiusScale(point.count) + 4);

        const [x, y] = projection([point.lon, point.lat]);
        svg
          .transition()
          .duration(750)
          .call(
            zoomHandler.transform,
            d3.zoomIdentity
              .translate(width / 2, height / 2)
              .scale(3)
              .translate(-x, -y)
          );
      });

    zoomHandler = d3
      .zoom()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        markers
          .attr(
            'r',
            (point) =>
              (radiusScale(point.count) + (activeCoordId === point.coordId ? 4 : 0)) /
              event.transform.k
          )
          .attr(
            'stroke-width',
            (point) => (activeCoordId === point.coordId ? 3 : 1.5) / event.transform.k
          );
      });

    svg.call(zoomHandler);
  }

  onMount(() => {
    d3.json('https://unpkg.com/world-atlas@2.0.2/countries-110m.json').then((data) => {
      worldCountries = topojson.feature(data, data.objects.countries);
      requestAnimationFrame(drawMap);
    });

    resizeObserver = new ResizeObserver(() => requestAnimationFrame(drawMap));
    if (svgElement?.parentElement) resizeObserver.observe(svgElement.parentElement);
  });

  onDestroy(() => resizeObserver?.disconnect());

  $effect(() => {
    mapData;
    color;
    accent;
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
      <ResetButton placement="inset-right" onclick={handleReset} label="Reset map" />
    {/if}
  </div>

  <ItemsBar items={selectedItems} {siteDomain} onclose={handleReset} />
</div>

<style>
  .mirla-map-outer {
    width: 100%;
    margin: var(--mirla-space-5xl, 2em) 0;
    font-family: var(--mirla-font-body, var(--pico-font-family, inherit));
  }

  .map-visual-area {
    position: relative;
    width: 100%;
    border-radius: var(--mirla-radius-md, var(--pico-border-radius, 8px));
    border: 1px solid var(--mirla-border-form, var(--pico-form-element-border-color, rgba(0, 0, 0, 0.1)));
    background: var(--mirla-surface, var(--pico-card-background-color, transparent));
    overflow: hidden;
  }

  svg {
    width: 100%;
    height: 400px;
    display: block;
    cursor: grab;
  }

  svg:active {
    cursor: grabbing;
  }

  .mirla-empty {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: var(--mirla-text-muted, var(--pico-muted-color, #999));
    font-style: italic;
  }
</style>
