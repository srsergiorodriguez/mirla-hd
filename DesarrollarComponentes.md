# Guía de Desarrollo de Componentes Web para Mirla

Esta guía detalla el proceso paso a paso para crear, registrar y compilar nuevos componentes interactivos personalizados para el sistema Mirla.

Todos los componentes de Mirla se construyen utilizando **Svelte 5** compilado a Web Components nativos (Custom Elements), lo que permite que funcionen perfectamente dentro de sitios estáticos generados por Publii sin requerir un framework frontend en ejecución.

---

## Estructura del Proyecto

El desarrollo de componentes ocurre en el directorio `svelte-components` de tu repositorio.

* `src/components/`: Aquí es donde viven todos tus archivos `.svelte`.
* `src/index.js`: El punto de entrada principal que registra los componentes.
  

OJO: Vite compila el archivo final `mirla-components.js` directamente en el tema mirlaTheme de Publii  `input/themes/assets/js`

---

## Paso 1: Crear el Archivo del Componente

Crea un nuevo archivo en `src/components/` (por ejemplo, `MirlaNuevo.svelte`). 

### Arquitectura de un Componente Mirla

Todos los componentes de Mirla deben adherirse a las siguientes convenciones para asegurar la compatibilidad con el sistema de datos generado por el plugin y el sistema de diseño (PicoCSS):

```html
<svelte:options customElement="mirla-nuevo" />

<script>
  // 1. DEFINICIÓN DE PROPS
  // Usa $props() de Svelte 5. Define valores por defecto para evitar errores.
  let { 
    titulo = "Título por Defecto",
    clave = "" // Ejemplo de prop para filtrar datos
  } = $props();

  // 2. CONSUMO DE DATOS
  // Los datos siempre son inyectados globalmente por el plugin de Publii
  const collectionData = window.MIRLA_COLLECTION_DATA || { items: [], filters: [], protocol: {} };
  const allItems = collectionData.items || [];
  
  // Opcional: Contexto global para internacionalización o dominio base
  const siteDomain = window.MIRLA_CONTEXT?.siteDomain || "";

  // 3. LÓGICA REACTIVA
  // Usa $derived para filtrar o procesar datos basados en los props
  let datosFiltrados = $derived.by(() => {
    if (!clave) return allItems;
    return allItems.filter(item => item[clave] !== undefined);
  });

</script>

<!-- 4. ESTRUCTURA HTML Y CLASES DEL SISTEMA DE DISEÑO -->
<div class="mirla-app-container">
  <h3>{titulo}</h3>
  
  <div class="controls-container">
    <p>Encontrados: {datosFiltrados.length} elementos.</p>
  </div>
</div>

<!-- 5. ESTILOS ENCAPSULADOS -->
<style>
  /* Contenedor principal: Hereda tipografía y colores del tema PicoCSS */
  .mirla-app-container {
    margin: 2em 0;
    font-family: var(--pico-font-family, inherit);
    color: var(--pico-color, inherit);
    
    /* Variable de borde estandarizada de Mirla para consistencia */
    --mirla-border: color-mix(in srgb, var(--pico-color, currentColor) 20%, transparent);
  }

  /* Tarjetas/Controles: Usa las variables de PicoCSS para soporte automático Claro/Oscuro */
  .controls-container {
    background: var(--pico-card-background-color, #f8f9fa);
    padding: 1.5rem;
    border-radius: var(--pico-border-radius, 8px);
    margin-bottom: 2rem;
    box-shadow: var(--pico-box-shadow, 0 2px 4px rgba(0,0,0,0.1));
    border: 1px solid var(--mirla-border);
  }
</style>
```

### Reglas Clave de Desarrollo
1. **Atributos siempre en minúsculas:** Las propiedades (props) de los custom elements deben ser pasadas sin guiones ni caracteres especiales (ej. usa `sourcekey`, no `source-key`).
2. **Variables de PicoCSS:** Nunca hardcodees colores estáticos (como `#ffffff` o `#000000`). Siempre usa variables como `var(--pico-card-background-color)` para garantizar que el componente respete el cambio entre Modo Claro y Oscuro de Publii.
3. **Manejo de Refs:** Recuerda que los atributos marcados como relacionales (`ref:Tabla`) en el `Protocol.csv` se pasan al componente como Arrays de Objetos (Stubs), no como simples Strings de texto. Escribe tu lógica de filtrado teniendo en cuenta la estructura `{ pid, label, images }`.

---

## Paso 2: Registrar el Componente

Abre el archivo `src/index.js` en tu proyecto Svelte y añade la importación de tu nuevo componente. Esto le indica a Vite que debe incluirlo en el bundle final de Web Components.

```javascript
// src/index.js
import "./components/MirlaPreview.svelte";
import "./components/MirlaGallery.svelte";
// ... otros componentes ...

import "./components/MirlaNuevo.svelte"; // Añade tu nuevo componente aquí
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