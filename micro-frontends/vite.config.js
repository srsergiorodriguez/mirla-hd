import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';

export default defineConfig({
  plugins: [
    svelte({
      // Include CSS inside the JS bundle
      emitCss: false
    }),
    // This plugin merges CSS into the JS file to have ONE file to link in Publii
    viteSingleFile()
  ],
  resolve: {
    alias: {
      '$api': path.resolve(__dirname, '../input/media/files/api'),
      '$collection': path.resolve(__dirname, '../preview/media/files/collection'),
    }
  },
  build: {
    // Publii theme folder js folder
    outDir: '../input/themes/mirlaTheme/assets/js',
    
    // We don't want to delete other files in the theme's js folder
    emptyOutDir: false,

    // This ensures CSS is injected into the JS file
    assetsInlineLimit: 100000000, 
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    
    rollupOptions: {
      // Define the different "apps" here
      input: {
        // Add the paths of needed microcomponents here
        'collection-app': './src/apps/collection/main.js'
      },
      output: {
        // [name] will be replaced by 'repo-app' or 'audio-player'
        entryFileNames: '[name].js',
        // 'iife' is critical: it prevents naming conflicts if both apps 
        // are on the same page
        format: 'iife' ,
        // Svelte CSS inlining
        inlineDynamicImports: true
      }
    },
    
    // Optimization for older browsers
    target: 'es2015',
  },
});