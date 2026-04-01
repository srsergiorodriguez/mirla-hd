import { mount } from 'svelte';
import CollectionApp from './App.svelte';

const target = document.getElementById('mirla-collection-app');

if (target) {  
  mount(CollectionApp, {
    target: target,
    props: {
      config: window.MIRLA_CONTEXT || { siteDomain: '' }
    }
  });
}