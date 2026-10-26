# Guía de Desarrollo de Componentes Web para Mirla

Esta guía detalla el proceso paso a paso para crear, registrar y compilar nuevos componentes interactivos personalizados para el sistema Mirla.

Todos los componentes de Mirla se construyen utilizando **Svelte 5** compilado a Web Components nativos (Custom Elements), lo que permite que funcionen perfectamente dentro de sitios estáticos generados por Publii sin requerir un framework frontend en ejecución.

---

## Estructura del Proyecto

El desarrollo de componentes ocurre en el directorio `svelte-components` de tu repositorio.

* `src/components/`: Los custom elements públicos (`<mirla-*>`).
* `src/components/index.js`: El punto de entrada que registra los componentes.
* `src/lib/data.js`: Helpers puros para leer y normalizar la colección.
* `src/lib/format.js`: Formateo de valores y textos.
* `src/lib/palette.js`: Paleta categórica compartida.
* `src/lib/ui/`: Primitivos internos (`Surface`, `SearchField`, `StatusBar`, `Button`, `Pager`, `EmptyState`, `ErrorState`, `ResetButton`, `ItemCard`, `ItemGrid`, `Legend`, `TableShell`).
* `src/dev/`: Colección sintética y arranque del harness de desarrollo.
* `index.html`: Harness visual (`npm run dev`). No se incluye en el bundle de producción.

OJO: Vite compila el archivo final `mirla-components.js` directamente en el tema de Publii: `input/themes/mirlaTheme/assets/js/`. No edites ese archivo a mano.

Para ejecutar el harness:

```bash
npm run dev
```

Para compilar y probar:

```bash
npm run test
npm run build
```

---

## Paso 1: Crear el Archivo del Componente

Crea un nuevo archivo en `src/components/` (por ejemplo, `MirlaNuevo.svelte`).

### Arquitectura de un Componente Mirla

Todos los componentes deben usar los helpers de datos y los primitivos del sistema de diseño. No leas `window.MIRLA_*` directamente ni dupliques controles.

```svelte
<svelte:options customElement="mirla-nuevo" />

<script>
  import { getCollection, getContext, getI18n, toLabels } from '$lib/data.js';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import SearchField from '$lib/ui/SearchField.svelte';
  import StatusBar from '$lib/ui/StatusBar.svelte';
  import Surface from '$lib/ui/Surface.svelte';

  let {
    titulo = 'Título por defecto',
    clave = ''
  } = $props();

  // 1. Datos y contexto: siempre a través de los helpers.
  const collectionData = getCollection();
  const { siteDomain } = getContext();
  const i18n = getI18n(globalThis, {
    searchPlaceholder: 'Buscar...',
    resultsFound: 'resultados'
  });

  // 2. Estado local y lógica reactiva.
  let searchQuery = $state('');
  let datosFiltrados = $derived.by(() => {
    if (!clave) return collectionData.items;
    return collectionData.items.filter(
      (item) => toLabels(item[clave]).length > 0 &&
        JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase())
    );
  });
</script>

<!-- 3. Estructura con primitivos y tokens. -->
<div class="mirla-app-container">
  <Surface>
    <h3>{titulo}</h3>
    <SearchField
      bind:value={searchQuery}
      placeholder={i18n.searchPlaceholder}
      label={i18n.searchPlaceholder}
      spacing="none"
    />
    <StatusBar count={datosFiltrados.length} suffix={i18n.resultsFound} />
  </Surface>

  {#if datosFiltrados.length === 0}
    <EmptyState variant="table">No hay resultados.</EmptyState>
  {/if}
</div>

<!-- 4. Estilos encapsulados. La mayoría de la UI ya vive en los primitivos. -->
<style>
  .mirla-app-container {
    margin: var(--mirla-space-5xl, 2em) 0;
    font-family: var(--mirla-font-body, var(--pico-font-family, inherit));
    color: var(--mirla-text, var(--pico-color, inherit));
  }
</style>
```

### Reglas Clave de Desarrollo

1. **Atributos siempre en minúsculas:** usa `sourcekey`, no `source-key`. Los atributos HTML se normalizan a minúsculas.
2. **Datos a través de helpers:** `getCollection`, `getContext`, `getI18n`, `toLabels`, `splitValues`, `getItemImage`, `groupCounts`, etc. No reimplementes la normalización de refs en cada componente.
3. **UI a través de primitivos:** `Surface`, `SearchField`, `FilterSelect`, `StatusBar`, `Button`, `Pager`, `EmptyState`, `ErrorState`, `ResetButton`, `ItemCard`, `ItemGrid`, `Legend`, `TableShell`. Si un control se repite en dos componentes, conviértelo en primitivo.
4. **Solo tokens:** usa `--mirla-*` con fallback a `--pico-*`. No hardcodees colores ni espaciados. Las únicas excepciones son la paleta categórica (`src/lib/palette.js`) y valores calculados en runtime.
5. **Sin estilos inline estáticos:** los atributos `style` solo se permiten para valores dinámicos (posición del slider, color de una celda, alto de un gráfico).
6. **Shadow DOM:** los custom elements usan Shadow DOM. Las variables CSS heredan, pero los selectores globales del tema no atraviesan la frontera. Usa selectores propios del componente, `:host` o atributos SVG/canvas generados por D3.
7. **Refs:** los atributos `ref` y `ref:Tabla` pueden llegar como string, array de strings o array de stubs `{ pid, label, images }`. Normalízalos con `toLabels`/`splitValues`.
8. **Accesibilidad:** botones reales, `aria-label` en iconos, foco visible, navegación por teclado y textos alternativos.
9. **Pruebas:** extrae la lógica pura a `src/lib/` y añade tests en `*.test.js` con Vitest. No escribas tests de rendering visual ni de layout.

---

## Paso 2: Registrar el Componente

Abre el archivo `src/components/index.js` y añade la importación de tu nuevo componente. Esto le indica a Vite que debe incluirlo en el bundle final de Web Components.

```javascript
// src/components/index.js
import "./MirlaPreview.svelte";
import "./MirlaGallery.svelte";
// ... otros componentes ...

import "./MirlaNuevo.svelte"; // Añade tu nuevo componente aquí
```

---

## Paso 3: Compilar y Distribuir

1. En la terminal, navega a tu carpeta `svelte-components` y ejecuta el comando de compilación (`npm run build`).
2. Esto generará o actualizará el archivo compilado `mirla-components.js` en la carpeta del tema.

---

## Paso 4: Configurar el Editor Visual (TinyMCE)

Para que Publii permita a los usuarios escribir la etiqueta de tu componente en el editor visual sin borrarla automáticamente por motivos de seguridad, debes registrar el componente en la configuración del tema.

Abre el archivo `mirlaTheme/tinymce.override.json` y añade tu nuevo componente (ej. `mirla-nuevo`) a ambos arrays:

```json
{
  "extended_valid_elements": [
    "mirla-preview[*]",
    "mirla-barchart[*]",
    "mirla-nuevo[*]" // Añadir aquí (asegúrate de incluir el [*] para permitir props)
  ],
  "custom_elements": [
    "mirla-preview",
    "mirla-barchart",
    "mirla-nuevo"    // Añadir aquí
  ]
}
```

---

## Paso 5: Estilizar el Placeholder en el Editor Visual

Para que los autores puedan ver e interactuar con el componente de manera cómoda dentro del editor visual de Publii (en lugar de que sea invisible y propenso a borrados accidentales), debes añadir reglas CSS en el tema.

Abre el archivo `mirlaTheme/assets/css/editor.css` y realiza las siguientes adiciones:

1. Añade tu componente a los selectores principales de estilo base y tipografía:
```css
mirla-index,
mirla-table,
/* ... otros componentes ... */
mirla-nuevo {
  display: block;
  width: 100%;
  /* ... estilos existentes del contenedor ... */
}

mirla-index::before,
mirla-table::before,
/* ... otros componentes ... */
mirla-nuevo::before {
  display: block;
  /* ... estilos tipográficos existentes ... */
}
```

2. Crea una regla específica para el texto que se mostrará en el marcador de posición, utilizando la función `attr()` para mostrar dinámicamente las propiedades que el usuario ha escrito:
```css
/* Placeholder específico para tu componente */
mirla-nuevo::before {
  content: "✨ Nuevo Componente Mirla (Título: " attr(titulo) ")";
}
```

---

¡Felicidades! Has desarrollado e integrado exitosamente un nuevo componente web en el sistema Mirla.