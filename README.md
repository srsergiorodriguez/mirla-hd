# Mirla

![Mirla Logo](repoAssets/mirlaLogo.png)

Mirla es un sistema diseñado para transformar sitios web estáticos (creados con Publii) en colecciones y exhibiciones digitales interactivas y publicaciones crossmedia (simultáneamente en línea e imprimibles). Está compuesto por un *tema*, que contiene el estilo, las páginas base y componentes interactivos, y por un *plugin*, que transforma y estructura los datos y crea páginas individuales para los ítems de la colección.

Sigue esta guía para instalar el *tema*, estructurar los datos de tu colección, configurar el *plugin* y usar los componentes interactivos personalizados de Mirla en tus páginas. Para lograr todo esto debes tener [Publii](https://getpublii.com/) instalado previamente y debes haber creado un sitio al que integrarás el sistema de Mirla. Puedes construir el sitio web con normalidad e incluir menús, páginas, posts, autores, etc. de la forma convencional en la que se trabaja en Publii.

- [Mirla](#mirla)
  - [Instalar el tema](#instalar-el-tema)
  - [Colecciones digitales](#colecciones-digitales)
    - [1. Preparar los archivos de tu colección](#1-preparar-los-archivos-de-tu-colección)
      - [A. `Protocol.csv`](#a-protocolcsv)
      - [B. `Metadata.csv`](#b-metadatacsv)
      - [C. La carpeta de imágenes (`images`)](#c-la-carpeta-de-imágenes-images)
      - [D. Otros medios](#d-otros-medios)
      - [E. Tablas secundarias (Bases de datos relacionales)](#e-tablas-secundarias-bases-de-datos-relacionales)
    - [2. Instalar y configurar el plugin](#2-instalar-y-configurar-el-plugin)
      - [Instalación](#instalación)
      - [Crear la plantilla de ítem](#crear-la-plantilla-de-ítem)
      - [Configurar el plugin](#configurar-el-plugin)
    - [3. Uso de los componentes interactivos de Mirla](#3-uso-de-los-componentes-interactivos-de-mirla)
      - [Galerías y Exploración](#galerías-y-exploración)
      - [Visualizaciones de Datos](#visualizaciones-de-datos)
      - [Componentes narrativos](#componentes-narrativos)
      - [Componentes de gestión de datos](#componentes-de-gestión-de-datos)
    - [Solución de problemas comunes](#solución-de-problemas-comunes)
  - [Publicaciones crossmedia](#publicaciones-crossmedia)

---

## Instalar el tema
El tema de Mirla contiene el estilo visual y las plantillas de página especializadas que se requieren para que la colección y los posts crossmedia se visualicen correctamente. Para instalar el tema sigue estas instrucciones:

1. En el repositorio, en la sección de releases, descarga el archivo `.zip` del tema de Mirla (mirlaTheme).
2. En Publii, haz clic en el **menú de tres puntos** en la esquina superior derecha.
3. Selecciona **Themes** (Temas) > **Install Theme** (Instalar tema) y selecciona el archivo `.zip`.
4. Ve a la configuración de tu sitio (Site settings) y selecciona el tema Mirla como tu tema activo.
5. Ve a la configuración del tema (Theme) y configura el aspecto y otros elementos del tema con normalidad: modo claro/oscuro, color de acento (Color Version), favicon, logo, fuentes personalizadas, etc.

---

## Colecciones digitales

### 1. Preparar los archivos de tu colección
Todos los datos y archivos multimedia de tu colección deben ponerse en la carpeta `input/media/files/collection` dentro de la carpeta de tu sitio en Publii. Los datos deben estar organizados exactamente de la siguiente manera:

#### A. `Protocol.csv`
Este archivo funciona como el protocolo que define los atributos principales de los ítems de tu colección. Debe contener exactamente dos encabezados: `Attribute` y `Type` (escritos exactamente así, incluyendo mayúsculas). Cada fila define un campo de metadatos y le indica a Mirla cómo mostrarlo en la tabla de metadatos del ítem.

Los Tipos (**Types**) disponibles incluyen:
* **`pid`**: (Obligatorio) El Identificador Persistente único para el ítem.
* **`label`**: (Obligatorio) El título o nombre legible para humanos del ítem.
* **`text`**: Cadenas de texto estándar.
* **`number`**: Valores numéricos (ej. precios, cantidades).
* **`date`**: Datos cronológicos (años o fechas completas).
* **`link`**: URLs externas o internas.
* **`youtube`**: Un ID de video de YouTube o URL para incrustar.
* **`image` / `video` / `audio`**: Archivos multimedia asociados con el ítem.
* **`ref`**: Referencias o enlaces cruzados a otros ítems dentro de la colección principal (pids separados por comas).
* **`ref:[NombreTabla]`**: Referencias a una tabla relacional secundaria. Por ejemplo, `ref:Tecnica` conectará automáticamente este atributo con los ítems definidos en `Metadata_Tecnica.csv`.
* **`latlong`**: Coordenadas geográficas formateadas como `"latitud, longitud"` (ej. `"4.7110, -74.0721"`). Se usa para mapas.

#### B. `Metadata.csv`
Esta es la hoja de cálculo maestra que contiene los datos principales de tu colección. Debe tener una fila para cada ítem de la colección.

* Los encabezados de este CSV **deben coincidir exactamente** con los nombres de la columna `Attribute` definidos en tu `Protocol.csv` (ten cuidado con las mayúsculas/minúsculas y los espacios al final).
* Los campos `pid` y `label` son estrictamente obligatorios para cada ítem.
* Si los encabezados no coinciden, la generación de las páginas individuales de los ítems fallará.

#### C. La carpeta de imágenes (`images`)
Esta carpeta contiene los recursos visuales para cada ítem de la colección.

* **Imágenes individuales:** Coloca archivos `.jpg` o `.png` individuales nombrados exactamente igual que el PID del ítem (ej. `item001.jpg`).
* **Múltiples imágenes:** Crea una subcarpeta nombrada exactamente igual que el pid del ítem (ej. una carpeta llamada `item001`). Coloca todas las imágenes dentro de esta carpeta. Se mostrarán en la galería del ítem en orden alfabético.

#### D. Otros medios
* Como es posible incluir múltiples tipos de medios (como audio y video) en las tablas de metadatos, estos archivos multimedia deben colocarse directamente en la carpeta principal `collection`, preferiblemente en una subcarpeta, aunque **no** en la carpeta de imágenes. Asegúrate de que los nombres de los archivos correspondan exactamente a lo que referencias en tus metadatos (relativo a la carpeta collection).

#### E. Tablas secundarias (Bases de datos relacionales)
Si tu colección es más compleja y necesitas conectar diferentes tipos de ítem sin repetir información (por ejemplo, múltiples publicaciones que comparten las mismas técnicas o autores), Mirla te permite usar tablas secundarias.

* Crea pares de archivos añadiendo un guion bajo y el nombre de la nueva categoría: ej. `Protocol_Tecnica.csv` y `Metadata_Tecnica.csv`.
* Los ítems en estas tablas secundarias deben seguir las mismas reglas básicas (tener un `pid` y un `label`).
* Para conectar tus ítems principales a esta nueva tabla, simplemente usa el tipo relacional en tu protocolo principal (ej. `ref:Tecnica`). Mirla enlazará ambas tablas automáticamente.

Así se debe ver la estructura de archivos de la colección:

![Mirla File Structure](repoAssets/fileStructure.png)

---

### 2. Instalar y configurar el plugin 
El plugin Mirla Collection Generator lee tus archivos CSV (principales y secundarios), construye una api consumible por los componentes interactivos y genera automáticamente páginas individuales con visores de imágenes y tablas de metadatos para cada ítem de la colección.

#### Instalación
1. Descarga el archivo `.zip` del plugin Mirla Collection Generator.
2. En Publii, haz clic en el **menú de tres puntos** en la esquina superior derecha.
3. Selecciona **Plugins** > **Install Plugin** (Instalar plugin) y selecciona el archivo `.zip`.
4. Regresa a la ventana principal de Publii.

#### Crear la plantilla de ítem
Para que el plugin funcione, necesita una página de plantilla de ítem que servirá de base para la presentación de las páginas de los ítems de la colección.

1. Crea una nueva página (post) en Publii. Dale un nombre administrativo claro (ej. "Página plantilla de ítem").
2. En la barra lateral derecha, baja hasta **Other Options** (Otras opciones).
3. En **Template** (Plantilla), selecciona **Collection Item Template**.
4. Haz clic en **Publish** (Publicar) en la página. *(Nota: No es necesario agregar esta página a los menús de navegación de tu sitio, pero debe estar publicada para que el plugin funcione).*
5. Regresa a la ventana principal de Publii.

#### Configurar el plugin
1. Ve a **Tools & Plugins** (Herramientas y Plugins) en la barra lateral izquierda.
2. Haz clic en el interruptor para activar el **Mirla Collection Generator**, luego haz clic en su logo para abrir la configuración.
3. Configura las dos opciones principales:
   * **Item Template Page:** Selecciona la "Página plantilla de ítem" que acabas de crear.
   * **Excluded Metadata:** Enumera los nombres de los atributos de tu CSV que *no* deseas que sean visibles para el público en la página de cada ítem (ej. `pid`, o notas internas como `_resena`).
4. Haz clic en **Save** (Guardar) para guardar tu configuración.

Ahora, cada vez que previsualices tus cambios o sincronices tu sitio web, el plugin generará las páginas de los ítems basándose en tus CSVs. Si ocurre un error, revisa el mensaje de error para encontrar pistas sobre cómo solucionarlo.

---

### 3. Uso de los componentes interactivos de Mirla
Mirla viene con un conjunto de componentes web personalizados que puedes insertar directamente en tus páginas para crear exhibiciones interactivas.

Para usarlos, abre una página en Publii, abre la vista de **Código Fuente** (Source Code) en el editor (el botón `<>`), y pega las etiquetas HTML. Cuando regreses al editor visual, verás una caja estilizada que sirve como marcador de posición.

*(Nota: ¡Todos los componentes se conectan automáticamente a los datos de tu colección y cambian de color fluidamente entre el Modo Oscuro y Claro!)*

#### Galerías y Exploración

**1. Índice de Colección (Index Gallery)**
El componente principal para explorar la colección. Muestra una cuadrícula de ítems con barra de búsqueda y filtros desplegables.
```html
<mirla-index type="" filters="medio_impresion, ciudad"></mirla-index>
```
* `type`: Si lo omites o lo dejas vacío, mostrará los ítems de tu `Metadata.csv` principal. Si escribes el nombre de una tabla secundaria (ej. `type="Tecnica"`), creará una galería exclusiva para esos ítems.
* `filters`: Una lista separada por comas de las columnas de tu CSV que deseas usar como menús desplegables para filtrar resultados.
* `itemsperpage`: Número de ítems por página de la galería. Se mostrarán unos botones para cambiar de página si el número de ítems lo sobrepasa. (opcional).

#### Visualizaciones de Datos
Al hacer clic en los puntos de datos dentro de estas visualizaciones, se abrirá automáticamente una galería detallada con los ítems asociados.

**2. Gráfico de Barras (Bar Chart)**
Muestra las categorías principales de tu colección.
```html
<mirla-barchart key="Categoría" top="10"></mirla-barchart>
```
* `key`: La columna de tu CSV por la cual agrupar.
* `top`: Limita el gráfico al top X de resultados (opcional).

**3. Gráfico de Waffle (Waffle Chart)**
Una cuadrícula de 10x10 que visualiza las categorías proporcionalmente, ideal para hacer un sobrevuelo de la composición de la colección.
```html
<mirla-waffle key="Categoría"></mirla-waffle>
```
* `key`: La columna de tu CSV por la cual agrupar.

**4. Línea de Tiempo (Timeline)**
Grafica ítems a lo largo de una línea de tiempo horizontal.
```html
<mirla-timeline datekey="Año"></mirla-timeline>
```
* `datekey`: La columna que contiene tus datos cronológicos (ej. `1998` o `1998-05-12`).

**5. Árbol / Dendrograma (Tree)**
Un árbol jerárquico que muestra cómo las categorías se desglosan en subcategorías.
```html
<mirla-tree keys="Categoría, Técnica, Año"></mirla-tree>
```
* `keys`: Una lista separada por comas de columnas que establecen la jerarquía (de padre a hijo).

**6. Gráfico de Red (Network Graph)**
Una red interactiva que muestra las conexiones entre entidades.
```html
<mirla-network sourcekey="Autor" targetkey="Movimiento"></mirla-network>
```
* `sourcekey` y `targetkey`: Las dos columnas que establecen las relaciones (ej. Autores y los Movimientos artísticos a los que pertenecen).

**7. Mapa Geográfico (Geographic Map)**
Un mapamundi interactivo que ubica tus ítems por su ubicación geográfica.
```html
<mirla-map coordkey="latlong"></mirla-map>
```
* `coordkey`: La columna que contiene tus cadenas de `"latitud, longitud"`.

---

#### Componentes narrativos
Usa estos para incrustar ítems específicos de la colección directamente en el flujo de tu redacción.

**8. Tarjeta de Vista Previa (Item Preview Card)**
Incrusta una tarjeta de vista previa limpia y en la que se puede hacer clic para un ítem específico.
```html
<mirla-preview pid="item001" title="Un artefacto único" page="1"></mirla-preview>
```
* `pid`: El pid del ítem a mostrar.
* `title`: Leyenda personalizada opcional.
* `page`: Qué imagen de la carpeta del ítem mostrar (por defecto es `1`).

**9. Minigalería en Línea (Inline Mini-Gallery)**
Crea una galería de ítems que coinciden con un criterio específico.
```html
<mirla-gallery key="Movimiento" value="Fluxus" limit="6"></mirla-gallery>
```
* `key`: La columna de metadatos a buscar.
* `value`: El valor específico con el que debe coincidir.
* `limit`: Número máximo de ítems a mostrar (opcional).

**10. Deslizador de Comparación de Imágenes (Comparison Slider)**
Un deslizador interactivo de "Antes y Después". Útil para mostrar restauración de archivos, múltiples capas o contrastar dos ítems diferentes.
```html
<mirla-compare pid1="item001" pid2="item002" label1="Rayos X" label2="Luz Visible"></mirla-compare>
```
* **Para comparar dos imágenes del MISMO ítem:** Solo proporciona `pid1`. Automáticamente usará la Imagen 1 y la Imagen 2 de la carpeta de ese ítem.
* **Para comparar dos ítems DIFERENTES:** Proporciona tanto `pid1` como `pid2`. Usará la primera imagen de cada uno.
* `label1` / `label2`: Las etiquetas de texto que aparecen en los lados izquierdo y derecho del deslizador.

---

#### Componentes de gestión de datos

**11. Tabla de Metadatos (Metadata Table)**
Una cuadrícula de datos de toda tu colección que se puede buscar, ordenar y descargar.
```html
<mirla-table title="Archivo de la Colección" excludedkeys="latlong, _resena"></mirla-table>
```
* `title`: El título que se muestra arriba de la tabla (opcional).
* `excludedkeys`: Una lista separada por comas de columnas de metadatos para ocultar de la vista pública (opcional).

**12. Diccionario de Datos (Protocol Table)**
Una tabla interactiva que expone el esquema de tu base de datos (Protocol.csv). Muestra cada atributo, su tipo de dato y su descripción, permitiendo a los usuarios buscar y entender la metodología y estructura de tu colección.

```html
<mirla-protocol title="Protocolo de datos"></mirla-protocol>
```

title: El título que se muestra arriba de la tabla (opcional).

---

### Solución de problemas comunes

Trabajar con datos estructurados requiere precisión. Si algo no se renderiza correctamente, generalmente se debe a un pequeño error tipográfico o un archivo mal ubicado. 

Cada vez que el plugin de Mirla se ejecuta, genera de manera automática un archivo de diagnóstico llamado `mirla-report.txt`. Este archivo se guarda directamente en la carpeta de tu colección (`input/media/files/collection/`). 

Si tu colección falla o algunos elementos no se muestran correctamente, abre este archivo de texto. El reporte te indicará exactamente en qué fila y en qué documento (Protocolo o Metadatos) se encuentra el error. Te notificará sobre identificadores faltantes (PIDs), tipos de datos incorrectos (ej. poner letras donde va un número), o referencias a tablas secundarias que no existen, facilitando la corrección rápida sin necesidad de usar la consola de desarrollador del navegador. Si todo funciona perfectamente, el archivo simplemente reportará un estado de éxito.

Además de esto, aquí están los problemas más comunes y cómo solucionarlos:

**1. "¡Las páginas de mis ítems no se generan!"**
* **Revisa tu Página plantilla de ítem:** ¿Recordaste hacer clic en "Publicar" en tu Página Base en Publii? El plugin no puede usarla si está guardada como borrador.
* **Revisa tus Encabezados:** Abre `Protocol.csv` y `Metadata.csv`. Los nombres de las columnas deben coincidir *exactamente*. "Categoría" no es lo mismo que "categoria" o " Categoría " (ten cuidado con los espacios en blanco accidentales al final de la palabra). Lo mismo aplica para las tablas secundarias (`Protocol_Tecnica.csv` y `Metadata_Tecnica.csv`).
* **Revisa los Campos Obligatorios:** Cada fila en tus CSV debe tener un `pid` (identificador persistente) y un `label`. Si a una fila le falta un PID, el generador fallará.

**2. "La página del ítem se generó, pero faltan las imágenes."**
* **Nombres de Carpetas:** Si estás usando una carpeta para múltiples imágenes, el nombre de la carpeta debe ser el PID *exacto* del ítem.
* **Nombres de Imágenes Individuales:** Si estás usando un solo archivo, debe llamarse `[pid].jpg` o `[pid].png`.
* **Ubicación:** Asegúrate de que tus imágenes estén dentro de `input/media/files/collection/images/[pid]` y no flotando en otro lugar en el administrador de medios de Publii.

**3. "Pegué un componente visualizador en mi página, pero aparece completamente en blanco."**
* **Falta de Coincidencia de la Clave (Key):** Si escribiste `<mirla-barchart key="Author"></mirla-barchart>`, pero tu columna del CSV se llama `Autores`, el gráfico encontrará cero datos y colapsará. El atributo `key` debe coincidir exactamente con el encabezado del CSV.
* **Datos Vacíos:** Asegúrate de que los ítems realmente tengan datos en la columna que intentas visualizar.
* **Comillas en HTML:** Asegúrate de usar comillas rectas (`" "`) alrededor de tus atributos HTML, no comillas curvas/inteligentes (`“ ”`) que algunos procesadores de texto insertan automáticamente.

**4. "El componente de Mapa no está ubicando mis puntos."**
* Revisa el formato de tus coordenadas: latitud y longitud en formato decimal, no grados, minutos y segundos. Tu columna de mapeo debe contener ambos números separados por una coma como una sola cadena de texto (ej. `4.7110, -74.0721`). Si una celda solo dice `Bogotá`, el mapa no sabrá cómo graficarlo.

**5. "El Deslizador de Comparación no muestra las imágenes."**
* El deslizador de comparación requiere al menos dos imágenes para funcionar. Si solo pasas un PID (`pid1="item001"`), la carpeta de ese ítem específico *debe* contener al menos dos imágenes. Si solo tiene una, el componente mostrará un mensaje de error.

**6. "El plugin no reconoce los metadatos."**
* Asegúrate de que el software que utilizaste para construir la tabla `Metadata.csv` en efecto exporta una tabla de columnas separadas por comas. Excel en español suele separar las columnas por punto y coma, lo que rompe el formato y produce errores. Recomiendo usar programas consistentes, como Google Sheets u Onlyoffice.

**7. "La visualización no cuenta los datos de manera correcta."**
* Al construir tus tablas, intenta mantener la consistencia en tus valores categóricos. Los visualizadores tratan `"Impresión"`, `"impresión"`, y `"Impresión "` como tres categorías completamente diferentes. ¡Usar un programa de hojas de cálculo para gestionar tus CSVs antes de ponerlos en la carpeta `collection` puede ayudarte a detectar estas inconsistencias a tiempo!

## Publicaciones crossmedia

(Documentación en proceso... :pray:)