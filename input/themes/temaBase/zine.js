/* * zine.js
 * Handles Paged.js configuration, dynamic sizing, and generative pages.
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
    case 'px': return Math.round(value); // Assume screen pixels (72dpi) need scaling? usually just return raw
    default: return Math.round(value * dpi); // Default to inches if unsure, or treat as raw
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
    const style = document.createElement('style');
    style.innerHTML = `
            @page { size: ${widthStr} ${heightStr}; }
            .canvas-page { width: ${widthStr}; height: ${heightStr}; } 
        `;
    document.head.appendChild(style);

    // Calculate canvas resolution
    printWidthPx = toPixels(widthStr);
    printHeightPx = toPixels(heightStr);

    console.log(`[Zine Engine] Page Size: ${widthStr} x ${heightStr} (${printWidthPx}px x ${printHeightPx}px @ 300DPI)`);
  }
})();

// Generative cover logic
function drawGenerativePages(canvas, pageIndex) {
  const ctx = canvas.getContext('2d');

  // Set resolution dynamically based on the CSS variables
  // Fallback to half letter if calculation fils
  canvas.width = printWidthPx || 1650;
  canvas.height = printHeightPx || 2550;

  // Background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Generative Lines
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 5;

  // Example: Page 0 is random lines, other pages are random circles
  if (pageIndex === 0) {
    for (let i = 0; i < 60; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }
  } else {
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 100, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

// 4. STARTUP FUNCTION
window.startZine = function () {
  console.log("[Zine Engine] Starting Paged.js...");

  class GenerativeHandler extends Paged.Handler {
    constructor(chunker, polisher, caller) {
      super(chunker, polisher, caller);
    }

    // This hook runs BEFORE pagination. Inject canvases into H2s.
    // renderNode(node) {
    //   if (node.tagName === 'H2') {
    //     const canvas = document.createElement('canvas');
    //     canvas.classList.add('generative-canvas');
    //     node.appendChild(canvas);
    //   }
    // }

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

// /* Every H2 starts a new, full-bleed art page */
// #page-entry h2 {
//   page: canvaspage; /* Uses full-bleed named page */
//   break-before: page;
//   break-after: avoid; /* Keep the first paragraph on the next page */
  
//   position: relative;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   height: var(--page-height);
//   width: var(--page-width);
//   margin: 0;
  
//   color: white;
//   mix-blend-mode: difference;
//   z-index: 10;
// }