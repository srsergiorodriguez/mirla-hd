/*
  zine.js
  Handles Paged.js configuration, dynamic sizing, and generative pages.
*/

window.PagedConfig = { auto: false }; // Avoid Paged.js auto start

// HELPER: Convert CSS units (in, mm, cm) to pixels at 300 DPI
function toPixels(cssValue) {
  if (!cssValue) return 0;
  const value = parseFloat(cssValue);
  const unit = cssValue.replace(/[\d\.]/g, '').trim().toLowerCase();

  const dpi = 300; // Standard print resolution

  switch (unit) {
    case 'in': return Math.round(value * dpi);
    case 'mm': return Math.round((value / 25.4) * dpi);
    case 'cm': return Math.round((value / 2.54) * dpi);
    case 'px': return Math.round(value);
    default: return Math.round(value * dpi); // Default to inches
  }
}

// Coherent sizes for pages and canvases
let printWidthPx = 0;
let printHeightPx = 0;

(function injectPageSize() {
  const rootStyles = getComputedStyle(document.documentElement);
  const widthStr = rootStyles.getPropertyValue('--page-width').trim();
  const heightStr = rootStyles.getPropertyValue('--page-height').trim();

  if (widthStr && heightStr) {
    // Inject the @page rule for Paged.js

    const widthValue = parseFloat(widthStr);
    const unit = widthStr.replace(/[\d\.]/g, '').trim();
    const adaptivePadding = (widthValue * 0.1).toFixed(2) + unit;

    const style = document.createElement('style');
    style.innerHTML = `
            @page { size: ${widthStr} ${heightStr}; }
            .canvas-page { 
                width: ${widthStr}; 
                height: ${heightStr}; 
                padding: ${adaptivePadding};
                box-sizing: border-box;
            }
        `;
    document.head.appendChild(style);

    // Calculate canvas resolution
    printWidthPx = toPixels(widthStr);
    printHeightPx = toPixels(heightStr);

    console.log(`[Zine Engine] Page Size: ${widthStr} x ${heightStr} (${printWidthPx}px x ${printHeightPx}px @ 300DPI)`);
  }
})();

// Generative page logic
function drawGenerativePages(canvasElement, pageIndex) {
  // Read the attribute from the canvas (e.g., <canvas data-type="grid">)
  const artType = canvasElement.getAttribute('data-type') || 'default';

  new p5((p) => {
    p.setup = () => {
      let w = printWidthPx || 1650;
      let h = printHeightPx || 2550;

      if (canvasElement.classList.contains('generative-separator')) {
         h = toPixels('10mm'); 
      }

      p.createCanvas(w, h, p.P2D, canvasElement);
      p.noLoop();

      canvasElement.style.width = '100%';
      canvasElement.style.height = 'auto';

      p.background(255);
      p.stroke(0);
      p.noFill();

      switch (artType) {

        case 'circles':
          p.strokeWeight(2);
          for (let i = 0; i < 100; i++) {
            p.ellipse(p.random(p.width), p.random(p.height), p.random(50, 100));
          }
          break;

        case 'portada-tutorial':
          p.noStroke();
          p.fill(0);

          let spacing = 35;

          for (let x = spacing / 2; x < p.width; x += spacing) {
            for (let y = spacing / 2; y < p.height; y += spacing) {
              let distance = p.dist(x, y, p.width / 2, p.height / 2);
              let radius = p.map(p.sin(distance * 0.015), -1, 1, 3, spacing * 0.9);
              p.circle(x, y, radius);
            }
          }
          break;

        case 'separador':
          p.noStroke();
          p.fill(0);
          let grid = 40;

          for (let x = grid / 2; x < p.width; x += grid) {
            for (let y = grid / 2; y < p.height; y += grid) {
              let ondaX = p.sin(x * 0.015);
              let ondaY = p.cos(y * 0.05);
              let radio = p.map(ondaX * ondaY, -1, 1, 1, grid * 0.9);
              p.circle(x, y, radio);
            }
          }
          break;

        default:
          break;
      }
    };
  }, canvasElement);
}

// 4. STARTUP FUNCTION
window.startZine = function () {
  console.log("[Zine Engine] Starting Paged.js...");

  class GenerativeHandler extends Paged.Handler {
    constructor(chunker, polisher, caller) {
      super(chunker, polisher, caller);
    }

    afterPageLayout(pageElement, page, breakToken) {
      // Look for the canvas class on EVERY page created
      const canvas = pageElement.querySelector('.generative-canvas, .generative-separator');
      if (canvas) {
        drawGenerativePages(canvas, page.position);
      }
    }
  }

  Paged.registerHandlers(GenerativeHandler);
  window.PagedPolyfill.preview();
};