# Getting Started with Mirla for Digital Collections

Mirla is an environment designed to transform static websites (built with Publii) into rich, interactive digital humanities collections and archival exhibitions. 

Follow this guide to install the theme, structure your collection data, configure the plugin, and use Mirla's custom interactive components in your articles.

![Mirla Logo](mirlaLogo.png)

---

## 1. Install the Theme
The Mirla theme provides the necessary styling foundation, responsive dark/light modes (via PicoCSS), and the specialized page templates required for the collection to render correctly.

1. Download the specially formatted Mirla Theme `.zip` file.
2. In the Publii desktop app, click on the **three dots menu** in the top right corner.
3. Select **Themes** > **Install Theme** and select the `.zip` file.
4. Go to your site settings and select the Mirla theme as your active theme.

---

## 2. Prepare Your Collection Files
All data and media for your collection must be placed securely in the `input/media/files/collection` folder within your Publii site directory. The data must be organized exactly as follows:

### A. `Protocol.csv`
This file acts as the blueprint for your collection. It must contain two exact headers: `Attribute` and `Type`. Each row defines a metadata field and tells Mirla how to render it in the item's metadata table. 

Available **Types** include:
* **`pid`**: (Required) The unique Persistent Identifier for the item.
* **`label`**: (Required) The human-readable title or name of the item.
* **`text`**: Standard text strings.
* **`number`**: Numeric values (e.g., prices, counts).
* **`date`**: Chronological data (years, or full dates).
* **`link`**: External or internal URLs.
* **`youtube`**: A YouTube video ID or URL to embed.
* **`image` / `video` / `audio`**: Media files associated with the item.
* **`ref`**: References or cross-links to other items in the collection.
* **`latlong`**: Geographic coordinates formatted as `"latitude, longitude"` (e.g., `"4.7110, -74.0721"`). Used for mapping.

### B. `Metadata.csv`
This is the master spreadsheet containing your actual collection data. 
* The headers of this CSV **must exactly match** the `Attribute` names defined in your `Protocol.csv` (be mindful of uppercase/lowercase and trailing spaces). 
* `pid` and `label` are strictly required for every item. 
* If headers do not match, the generation of individual item pages will fail.

### C. The `Images` Folder
This folder contains the visual assets for each element in the collection.
* **Single Images:** Place individual `.jpg` or `.png` files named exactly after the item's PID (e.g., `item001.jpg`).
* **Multiple Images:** Create a subfolder named exactly after the item's PID (e.g., a folder named `item001`). Place all images inside this folder. They will be displayed in the item's gallery in alphabetical order.

### D. Other Media
* As it is possible to include multiple media types (like audio and video) in the metadata cards, these media files should be placed directly in the main `collection` folder, **not** in the images folder. Ensure their filenames correspond to what you reference in your metadata.

---

## 3. Install and Configure the Plugin
The Mirla Collection Generator plugin reads your CSV files and automatically generates individual pages, galleries, and metadata tables for every item in the collection.

### Installation
1. Download the Mirla Collection Generator plugin `.zip` file.
2. In Publii, click the **three dots menu** in the top right corner.
3. Select **Plugins** > **Install Plugin** and select the `.zip` file.
4. Return to the main window of Publii.

### Create the "Stub" Page
In order for the plugin to work, it needs a master template page to copy.
1. Create a new post/page in Publii. Give it a clear administrative name (e.g., "Item Page Stub").
2. In the right-hand sidebar, scroll down to **Other Options**.
3. Under **Template**, select **Collection Item Template**.
4. **Publish** the page. *(Note: You do not need to add this page to your site's navigation menus, but it must be published for the plugin to work).*
5. Return to the main window of Publii.

### Configure the Plugin
1. Go to **Tools & Plugins** in the left sidebar.
2. Toggle the switch to activate the **Mirla Collection Generator**, then click its logo to open the settings.
3. Configure the three main options:
   * **Item Template Page:** Select the "Item Page Stub" you just created.
   * **Excluded Metadata:** List the attribute names from your CSV that you *do not* want visible to the public (e.g., `pid`, internal notes, acquisition costs).
   * **Gallery Filters:** List the attributes you want users to be able to filter by in the collection's main search bar (e.g., `Category`, `Year`, `Author`).
4. **Save** your settings.

Now, whenever you preview your changes or sync your website, the plugin will generate the item pages based on your CSVs. If an error occurs, check the error message for clues about how to fix it.

---

## 4. Using Mirla Interactive Components
Mirla comes with a suite of custom Web Components (Visualizers) that you can drop directly into your articles to create interactive exhibitions. 

To use these, open a Publii article, open the **Source Code** view in the editor (the `<>` button), and paste the HTML tags. When you return to the visual editor, you will see a stylized placeholder box. 

*(Note: All components automatically connect to your `Metadata.csv` data and seamlessly switch colors between Dark and Light mode!)*

### Data Visualizations
Clicking on data points inside these visualizations will automatically open a "drill-down" gallery of the associated items.

**1. Bar Chart**
Displays the top categories in your collection.
```html
<mirla-barchart key="Category" top="10"></mirla-barchart>
```
* `key`: The column from your CSV to group by.
* `top`: Limits the chart to the top X results (optional).

**2. Waffle Chart**
A 10x10 grid that visualizes proportions beautifully, ideal for physical collections.
```html
<mirla-waffle key="Category"></mirla-waffle>
```
* `key`: The column from your CSV to group by.

**3. Timeline**
Plots items across a horizontal timeline.
```html
<mirla-timeline date-key="Year"></mirla-timeline>
```
* `date-key`: The column containing your chronological data (e.g., `1998` or `1998-05-12`).

**4. Tree / Dendrogram**
A hierarchical tree showing how categories break down into subcategories.
```html
<mirla-tree keys="Category, Medium, Year"></mirla-tree>
```
* `keys`: A comma-separated list of columns establishing the hierarchy (from parent to child).

**5. Network Graph**
A physics-based, interactive canvas showing connections between entities.
```html
<mirla-network source-key="Author" target-key="Movement"></mirla-network>
```
* `source-key` & `target-key`: The two columns establishing the relationships (e.g., Authors and the Artistic Movements they belong to).

**6. Geographic Map**
An interactive world map that plots your items by location.
```html
<mirla-map coord-key="latlong"></mirla-map>
```
* `coord-key`: The column containing your `"latitude, longitude"` strings.

---

### In-Text Narrative Components
Use these to embed specific collection items directly into the flow of your writing.

**7. Item Preview Card**
Embeds a neat, clickable preview card for a specific item.
```html
<mirla-preview pid="item001" title="A unique artifact" page="1"></mirla-preview>
```
* `pid`: The ID of the item to display.
* `title`: Optional custom caption.
* `page`: Which image from the item's folder to display (defaults to `1`).

**8. Inline Mini-Gallery**
Creates a masonry gallery of items matching a specific criteria.
```html
<mirla-gallery key="Movement" value="Fluxus" limit="6"></mirla-gallery>
```
* `key`: The metadata column to search.
* `value`: The specific value to match.
* `limit`: Maximum number of items to show (optional).

**9. Image Comparison Slider**
An interactive "Before and After" slider. Perfect for showing archival restoration, multiple layers, or contrasting two different items.
```html
<mirla-compare pid1="item001" pid2="item002" label1="X-Ray" label2="Visible Light"></mirla-compare>
```
* **To compare two images of the SAME item:** Just provide `pid1`. It will automatically use Image 1 and Image 2 from that item's folder.
* **To compare two DIFFERENT items:** Provide both `pid1` and `pid2`. It will use the first image from each.
* `label1` / `label2`: The text tags that appear on the left and right sides of the slider.

---

### Data Management Components

**10. Metadata Table**
A searchable, sortable, and downloadable data grid of your entire collection.
```html
<mirla-table title="Collection Archive" excluded-keys="latlong, _resena"></mirla-table>
```
* `title`: The title displayed above the table (optional).
* `excluded-keys`: A comma-separated list of metadata columns to hide from the public view (optional).

---

## 5. Troubleshooting Common Issues

Working with structured data requires precision. If something isn’t rendering correctly, it is usually due to a small typo or a misplaced file. Here are the most common issues and how to fix them:

**1. "My item pages aren't generating at all!"**
* **Check your Stub Page:** Did you remember to hit "Publish" on your Item Page Stub in Publii? The plugin cannot use it if it is saved as a draft.
* **Check your Headers:** Open `Protocol.csv` and `Metadata.csv`. The column names must match *exactly*. "Categoría" is not the same as "categoria" or " Categoría " (watch out for accidental blank spaces at the end of the word).
* **Check Required Fields:** Every row in your `Metadata.csv` must have a `pid` (Persistent Identifier) and a `label`. If a row is missing a PID, the generator will fail.

**2. "The item page generated, but the images are missing."**
* **Folder Naming:** If you are using a folder for multiple images, the folder name must be the *exact* PID of the item. 
* **Single Image Naming:** If you are using a single file, it must be named `[pid].jpg` or `[pid].png`.
* **Location:** Ensure your images are inside `input/media/files/collection/[pid]` and not floating somewhere else in Publii's media manager.

**3. "I pasted a visualizer component into my article, but it's completely blank."**
* **Key Mismatch:** If you wrote `<mirla-barchart key="Author"></mirla-barchart>`, but your CSV column is named `Autores`, the chart will find zero data and collapse. The `key` attribute must exactly match the CSV header.
* **Empty Data:** Ensure that the items actually have data in the column you are trying to visualize. 
* **Quotes in HTML:** Make sure you are using straight quotes (`" "`) around your HTML attributes, not curly/smart quotes (`“ ”`) which some word processors insert automatically.

**4. "The Map component isn't plotting my points."**
* Check your coordinate formatting. Your mapping column must contain both numbers separated by a comma as a single string (e.g., `4.7110, -74.0721`). If a cell just says `Bogotá`, the map will not know how to plot it. 

**5. "The Comparison Slider isn't showing the images."**
* The comparison slider requires at least two images to work. If you only pass one PID (`pid1="item001"`), that specific item's folder *must* contain at least two images. If it only has one, the component will display an error message.

**6. "The formatting of the components looks broken or overlaps text."**
* Sometimes the WYSIWYG editor wraps custom components in paragraph tags `<p></p>`. Open the Source Code view (`<>`) in the Publii editor and make sure your `<mirla-...>` tags are standing on their own line, outside of any `<p>` or `<span>` tags.

---

### Pro-Tip for Data Entry
When building your `Metadata.csv`, try to keep your categorical values consistent. The visualizers treat `"Print"`, `"print"`, and `"Print "` as three completely different categories. Using a spreadsheet program (like Excel or Google Sheets) to manage your CSVs before putting them in the `collection` folder can help you spot these inconsistencies early!