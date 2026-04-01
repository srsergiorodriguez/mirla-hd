import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        customElement: true, 
      },
      emitCss: false 
    })
  ],
  resolve: {
    alias: {
      '$api': path.resolve(__dirname, '../input/media/files/api'),
      '$lib': path.resolve(__dirname, './src/lib'),
    }
  },
  build: {
    outDir: '../input/themes/mirlaTheme/assets/js',
    emptyOutDir: false,
    
    lib: {
      entry: {
        'mirla-components': './src/components/index.js',
      },
      formats: ['iife'], 
      name: 'MirlaComponents'
    },
    
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        inlineDynamicImports: true 
      }
    },
    target: 'es2017', 
  },
});