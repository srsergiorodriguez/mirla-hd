import './dev.css';

import { collection, context } from './fixture.js';

window.MIRLA_COLLECTION_DATA = collection;
window.MIRLA_CONTEXT = context;

const themeToggle = document.getElementById('theme-toggle');
themeToggle?.addEventListener('change', () => {
  document.documentElement.dataset.theme = themeToggle.checked ? 'light' : 'dark';
});

// Import after the globals are installed: custom elements upgrade immediately
// when they are defined. Report import failures in the harness panel.
try {
  await import('../components/index.js');
} catch (error) {
  window.reportHarnessError?.(error?.stack || error);
}
