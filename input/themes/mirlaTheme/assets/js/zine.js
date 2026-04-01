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
      p.createCanvas(printWidthPx || 1650, printHeightPx || 2550, p.P2D, canvasElement);
      p.noLoop();

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

        case 'grid':
          p.strokeWeight(1);
          for (let x = 0; x < p.width; x += 50) {
            for (let y = 0; y < p.height; y += 50) {
              if (p.random() > 0.1) {
                p.ellipse(x, y, 10);
              }
            }
          }
          break;

        default:
          // Fallback
          // p.text(`Page ${pageIndex}`, 50, 50);
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
      const canvas = pageElement.querySelector('.generative-canvas');
      if (canvas) {
        drawGenerativePages(canvas, page.position);
      }
    }
  }

  Paged.registerHandlers(GenerativeHandler);
  window.PagedPolyfill.preview();
};