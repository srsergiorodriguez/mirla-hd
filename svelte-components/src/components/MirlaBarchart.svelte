<svelte:options customElement="mirla-barchart" />

<script>
  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';
  import ItemsBar from "$lib/ItemsBar.svelte";

  // 1. Props
  let { 
    key = "",     
    top = "10",   
    color = "var(--pico-primary, #4a90e2)", // Default to Pico's active theme color
    usePalette = "false" // Set to "true" to use the categorical palette
  } = $props();

  const categoricalPalette = ["#e60049", "#0bb4ff", "#50e991", "#e6d800", "#9b19f5", "#ffa300", "#dc0ab4", "#b3d4ff", "#00bfa0", "#97421dff"];

  // 2. Context & Data
  const collectionData = window.MIRLA_COLLECTION_DATA || { items: [] };
  const metadata = collectionData.items;
  const siteDomain = window.MIRLA_CONTEXT?.siteDomain || "";

  // 3. State
  let svgElement = $state();
  let resizeObserver;
  let selectedItems = $state([]);
  let activeCategory = $state(null);

  // 4. Data Transformation (Now groups raw items for the ItemsBar)
  let chartData = $derived.by(() => {
    if (!key || metadata.length === 0) return [];
    
    const groups = d3.group(metadata, d => d[key]);
    let sorted = Array.from(groups, ([k, items]) => ({ key: k, count: items.length, items }))
      .filter(d => d.key !== undefined && d.key !== "" && d.key !== null)
      .sort((a, b) => d3.descending(a.count, b.count));

    const topN = parseInt(top, 10);
    if (!isNaN(topN) && topN > 0) sorted = sorted.slice(0, topN);
    return sorted;
  });

  let chartHeight = $derived(chartData.length > 0 ? (chartData.length * 45) + 60 : 200);

  function handleReset() {
    selectedItems = [];
    activeCategory = null;
    if (svgElement) {
      d3.select(svgElement).selectAll("rect")
        .transition().duration(300)
        .attr("opacity", 1);
    }
  }

  function drawChart() {
    if (!svgElement || chartData.length === 0) return;
    
    const svg = d3.select(svgElement);
    svg.selectAll("*").remove(); 

    const width = svgElement.parentElement.clientWidth;
    const height = chartHeight; 

    svg.attr("viewBox", [0, 0, width, height]);
    const margin = { top: 20, right: 40, bottom: 40, left: 150 };

    // Clipping Mask to prevent bars/text from escaping the bounds
    svg.append("defs").append("clipPath")
      .attr("id", "mirla-bar-clip")
      .append("rect")
      .attr("x", margin.left)
      .attr("y", 0)
      .attr("width", width - margin.left - margin.right + 20) // +20 allows the end of the bar to render cleanly
      .attr("height", height);

    const x = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => d.count)])
      .range([margin.left, width - margin.right])
      .nice();

    const y = d3.scaleBand()
      .domain(chartData.map(d => d.key))
      .range([margin.top, height - margin.bottom])
      .padding(0.25); // Slightly more padding for the minimalist look

    const colorScale = d3.scaleOrdinal().range(categoricalPalette);

    // Axes
    const xAxis = g => g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(Math.max(width / 80, 2)).tickSizeOuter(0))
      .attr("font-family", null)
      .selectAll(".tick text")
      .attr("font-size", "0.8rem") 
      .call(g => g.select(".domain").remove()); 

    const yAxis = g => g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickSizeOuter(0))
      // 1. Strip D3's hardcoded default from the group
      .attr("font-size", null) 
      .attr("font-family", null)
      .selectAll(".tick text")
      // 2. Force new size directly onto the text elements
      .attr("font-size", "0.8rem") 
      .call(wrapText, margin.left - 15);

    // Bars
    svg.append("g")
      .attr("clip-path", "url(#mirla-bar-clip)")
      .selectAll("rect")
      .data(chartData)
      .join("rect")
        .attr("x", x(0))
        .attr("y", d => y(d.key))
        .attr("width", d => Math.max(0, x(d.count) - x(0)))
        .attr("height", y.bandwidth())
        .attr("rx", 6) // Rounded corners
        .attr("fill", (d, i) => usePalette === "true" ? colorScale(i) : color)
        .attr("opacity", d => activeCategory === null || activeCategory === d.key ? 1 : 0.3)
        .style("cursor", "pointer")
        .on("click", (event, d) => {
          activeCategory = d.key;
          selectedItems = d.items;
          svg.selectAll("rect")
            .transition().duration(300)
            .attr("opacity", rectData => rectData.key === d.key ? 1 : 0.3);
        })
        // Hover effect
        .on("mouseenter", function(event, d) {
           if (!activeCategory) d3.select(this).attr("opacity", 0.8);
        })
        .on("mouseleave", function(event, d) {
           if (!activeCategory) d3.select(this).attr("opacity", 1);
        });

    svg.append("g").attr("class", "axis x-axis").call(xAxis);
    svg.append("g").attr("class", "axis y-axis").call(yAxis);
  }

  // D3 Helper to wrap long SVG text labels
  function wrapText(text, width) {
    text.each(function() {
      let textNode = d3.select(this),
          words = textNode.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 1.2, 
          y = textNode.attr("y"),
          dy = parseFloat(textNode.attr("dy") || 0.32),
          tspan = textNode.text(null).append("tspan").attr("x", -12).attr("y", y).attr("dy", dy + "em");
      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = textNode.append("tspan").attr("x", -12).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
        }
      }
    });
  }

  onMount(() => {
    resizeObserver = new ResizeObserver(() => requestAnimationFrame(drawChart));
    if (svgElement?.parentElement) resizeObserver.observe(svgElement.parentElement);
  });

  onDestroy(() => resizeObserver?.disconnect());
  $effect(() => { chartData; color; usePalette; drawChart(); });
</script>

<div class="mirla-barchart-outer">
  {#if chartData.length === 0}
    <div class="no-data">No data found for key "{key}"</div>
  {:else}
    <div class="visual-area" style="height: {chartHeight}px;">
      <svg bind:this={svgElement}></svg>
      {#if activeCategory}
        <button class="reset-viz-btn" onclick={handleReset} title="Reset">↺</button>
      {/if}
    </div>
    
    <ItemsBar 
      items={selectedItems} 
      {siteDomain} 
      onclose={handleReset} 
    />
  {/if}
</div>

<style>
  .mirla-barchart-outer {
    width: 100%;
    margin: 2em 0;
    font-family: var(--pico-font-family, inherit);
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
  
  .no-data {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100px;
    background: transparent;
    color: var(--pico-muted-color);
    border: 1px dashed var(--pico-muted-border-color);
    border-radius: var(--pico-border-radius);
    font-family: monospace;
  }

  .reset-viz-btn {
    position: absolute;
    top: 0;
    right: 0;
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
  :global(mirla-barchart svg text) {
    font-family: var(--pico-font-family, inherit);
    font-size: 0.9rem; /* Increased size, no longer tiny D3 default */
    fill: var(--pico-color, currentColor); /* Dark mode compatible */
  }

  :global(mirla-barchart svg text) {
    font-family: var(--pico-font-family, inherit);
    font-size: 0.9rem; 
    fill: var(--pico-color, currentColor); 
  }

  :global(mirla-barchart .axis path),
  :global(mirla-barchart .axis line) {
    stroke: var(--pico-muted-color, #ccc); /* Adapts to theme */
  }
</style>