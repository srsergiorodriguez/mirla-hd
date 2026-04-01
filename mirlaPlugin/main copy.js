const fs = require('fs');
const path = require('path');
const Papa = require('./papaparse.min.js'); 

class MirlaCollectionGenerator {
  constructor(API, name, config) {
    this.API = API;
    this.name = name;
    this.config = config;
  }

  addEvents() {
    if (this.config.enableGenerator) {
      this.API.addEvent('afterRender', this.processDataset.bind(this), 1, this);
    }
  }

  processDataset(rendererInstance) {
    console.log("==========================================");
    console.log("[Mirla Plugin] Starting Generation & Validation...");

    const inputDir = rendererInstance.inputDir;
    const outputDir = rendererInstance.outputDir;
    
    const collectionInputPath = path.join(inputDir, 'media', 'files', 'collection');
    const metadataPath = path.join(collectionInputPath, 'Metadata.csv');
    const protocolPath = path.join(collectionInputPath, 'Protocol.csv');
    const imagesInputPath = path.join(collectionInputPath, 'images');

    // 1. Verify files exist
    if (!fs.existsSync(metadataPath)) {
      console.log(`[Mirla Plugin] FATAL ERROR: Metadata.csv not found at ${metadataPath}`);
      return;
    }
    if (!fs.existsSync(protocolPath)) {
      console.log(`[Mirla Plugin] FATAL ERROR: Protocol.csv not found at ${protocolPath}`);
      return;
    }

    // 2. Parse Protocol.csv
    const protocolRaw = fs.readFileSync(protocolPath, 'utf8');
    const protocolParsed = Papa.parse(protocolRaw, { header: true, skipEmptyLines: true });

    if (protocolParsed.errors.length > 0) {
      console.log("[Mirla Plugin] FATAL ERROR: Protocol.csv Parsing Errors: " + JSON.stringify(protocolParsed.errors));
      return;
    }

    // Map the attributes to their types based on Protocol.csv
    const protocolMap = {};
    protocolParsed.data.forEach(row => {
      if (row.Attribute && row.Type) {
        protocolMap[row.Attribute.trim()] = row.Type.trim().toLowerCase();
      }
    });
    
    console.log("[Mirla Plugin] Loaded Protocol Schema:", JSON.stringify(protocolMap));

    // 3. Parse Metadata.csv
    const csvRaw = fs.readFileSync(metadataPath, 'utf8');
    const parsed = Papa.parse(csvRaw, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true // Converts numbers automatically
    });

    if (parsed.errors.length > 0) {
      console.log("[Mirla Plugin] FATAL ERROR: Metadata.csv Parsing Errors: " + JSON.stringify(parsed.errors));
      return;
    }

    const collectionData = parsed.data;

    // ==========================================
    // 4. BATCH VALIDATION (Fatal Errors)
    // ==========================================
    
    if (collectionData.length === 0) {
      throw new Error("[Mirla Plugin] FATAL ERROR: Metadata is empty");
    }

    if (!('pid' in collectionData[0])) {
      throw new Error("[Mirla Plugin] FATAL ERROR: Metadata lacks 'pid' column");
    }

    // Check for unique PIDs
    const allPids = collectionData.map(d => d.pid).filter(p => p !== undefined && p !== null && p !== '');
    const uniquePids = new Set(allPids);
    if (uniquePids.size !== allPids.length) {
      throw new Error("[Mirla Plugin] FATAL ERROR: There are duplicate pids");
    }

    // ==========================================
    // 5. ROW VALIDATION & IMAGE PROCESSING
    // ==========================================
    
    let processedCount = 0;
    let errorCount = 0;

    // Filter out rows that completely lack a PID so they don't crash the JSON
    const validCollectionData = collectionData.filter((item, index) => {
      const rowNumber = index + 2; // +2 because row 1 is the header
      const pid = item.pid;
      
      if (!pid) {
        console.log(`[Mirla Plugin] ROW ERROR (Fila ${rowNumber}): Row without pid. Skipping.`);
        errorCount++;
        return false; 
      }

      // -- DYNAMIC TYPE VALIDATION --
      let rowHasTypeErrors = false;
      for (const [attr, expectedType] of Object.entries(protocolMap)) {
        const val = item[attr];
        
        // Only validate if a value exists (assuming empty cells are allowed)
        if (val !== undefined && val !== null && val !== '') {
          
          if (expectedType === 'number') {
            if (typeof val !== 'number' && isNaN(Number(val))) {
              console.log(`[Mirla Plugin] TYPE ERROR (Row ${rowNumber}, pid: ${pid}): '${attr}' must be a number, got: '${val}'`);
              rowHasTypeErrors = true;
            }
          } 
          else if (expectedType === 'link') {
            if (typeof val !== 'string' || (!val.startsWith('http://') && !val.startsWith('https://'))) {
              console.log(`[Mirla Plugin] TYPE ERROR (Row ${rowNumber}, pid: ${pid}): '${attr}' must be a link, got: '${val}'`);
              rowHasTypeErrors = true;
            }
          } 
          else if (expectedType === 'date') {
            if (isNaN(Date.parse(val.toString()))) {
              console.log(`[Mirla Plugin] TYPE ERROR (Row ${rowNumber}, pid: ${pid}): '${attr}' must be a valid date, got: '${val}'`);
              rowHasTypeErrors = true;
            }
          }
        }
      }

      if (rowHasTypeErrors) {
        errorCount++;
      }

      // -- IMAGE MAPPING --
      item.images = [];
      const singleImageJpg = path.join(imagesInputPath, `${pid}.jpg`);
      const singleImagePng = path.join(imagesInputPath, `${pid}.png`);
      const folderPath = path.join(imagesInputPath, pid);
      
      const publicMediaUrl = `/media/files/collection/images`;

      if (fs.existsSync(singleImageJpg)) {
        item.images.push(`${publicMediaUrl}/${pid}.jpg`);
      } else if (fs.existsSync(singleImagePng)) {
        item.images.push(`${publicMediaUrl}/${pid}.png`);
      } 
      else if (fs.existsSync(folderPath) && fs.lstatSync(folderPath).isDirectory()) {
        const files = fs.readdirSync(folderPath);
        files.forEach(file => {
          if (file.match(/\.(jpg|jpeg|png|webp)$/i)) {
            item.images.push(`${publicMediaUrl}/${pid}/${file}`);
          }
        });
      }

      processedCount++;
      return true; // Keep this item in the final JSON array
    });

    // 6. Save the compiled dataset and protocol schema
    const finalJsonPath = path.join(outputDir, 'media', 'files', 'collection', 'collection.json');
    const outputCollectionDir = path.dirname(finalJsonPath);
    if (!fs.existsSync(outputCollectionDir)) {
      fs.mkdirSync(outputCollectionDir, { recursive: true });
    }

    // Wrap the protocol map and the items array into a single source of truth
    const finalExportData = {
      protocol: protocolMap,
      items: validCollectionData
    };

    fs.writeFileSync(finalJsonPath, JSON.stringify(finalExportData, null, 2), 'utf8');

// ==========================================
    // 6. GENERATE INDIVIDUAL ITEM PAGES
    // ==========================================
    
    // 1. Get the Page ID from the dropdown
    const templatePageId = this.config.templatePageId;
    if (!templatePageId) {
      throw new Error("[Mirla Plugin] FATAL ERROR: No se seleccionó una página plantilla / No template page selected in settings.");
    }

    // 2. Look up the page using Publii's internal cached dictionary
    const templatePage = rendererInstance.cachedItems.pages[templatePageId] || 
                         (rendererInstance.commonData.pages || []).find(p => p.id.toString() === templatePageId.toString());

    if (!templatePage) {
      throw new Error(`[Mirla Plugin] FATAL ERROR: No se pudo encontrar la página con ID ${templatePageId} en la base de datos.`);
    }

    const templateSlug = templatePage.slug;

    // 3. Locate the rendered HTML file (Checking for both Clean URLs and Standard URLs)
    const cleanUrlPath = path.join(outputDir, templateSlug, 'index.html');
    const standardUrlPath = path.join(outputDir, `${templateSlug}.html`);
    
    let templateHtmlPath = '';
    
    if (fs.existsSync(cleanUrlPath)) {
      templateHtmlPath = cleanUrlPath;
    } else if (fs.existsSync(standardUrlPath)) {
      templateHtmlPath = standardUrlPath;
    } else {
      throw new Error(`[Mirla Plugin] FATAL ERROR: No se encontró el HTML de la plantilla / Could not find compiled HTML for template at either ${templateSlug}.html or ${templateSlug}/index.html`);
    }

    // 4. Read the raw HTML of the template
    const rawTemplateHtml = fs.readFileSync(templateHtmlPath, 'utf8');

    // Create a base directory for all individual item pages
    const itemsOutputDir = path.join(outputDir, 'item');
    if (!fs.existsSync(itemsOutputDir)) {
      fs.mkdirSync(itemsOutputDir, { recursive: true });
    }

    let pagesGenerated = 0;

    validCollectionData.forEach(item => {
      // Create a specific folder for this item using its PID
      const itemFolder = path.join(itemsOutputDir, item.pid);
      if (!fs.existsSync(itemFolder)) {
        fs.mkdirSync(itemFolder, { recursive: true });
      }

      // Inject the data: Pass the specific item data to the window object 
      const dataInjectionScript = `
        <script>
          window.MIRLA_ITEM_DATA = ${JSON.stringify(item)};
          window.MIRLA_PROTOCOL = ${JSON.stringify(protocolMap)};
        </script>
      `;

      // Inject the script right before the closing </head> tag
      const modifiedHtml = rawTemplateHtml.replace('</head>', `${dataInjectionScript}\n</head>`);

      // Write the new HTML file (we force these to act like clean URLs so Svelte routing is easier)
      const itemHtmlPath = path.join(itemFolder, 'index.html');
      fs.writeFileSync(itemHtmlPath, modifiedHtml, 'utf8');
      
      pagesGenerated++;
    });

    console.log(`[Mirla Plugin] Page Generation: Wrote ${pagesGenerated} individual item pages to the /item/ directory.`);
  }
}

module.exports = MirlaCollectionGenerator;