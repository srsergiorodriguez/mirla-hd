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
    this.API.addEvent('afterRender', this.processDataset.bind(this), 1, this);
  }

  processDataset(rendererInstance) {
    console.log("==========================================");
    console.log("[Mirla Plugin] Starting Generation & Validation...");

    const inputDir = rendererInstance.inputDir;
    const outputDir = rendererInstance.outputDir;

    // ==========================================
    // 0. COPY PLUGIN ASSETS (OSD ICONS)
    // ==========================================
    const pluginIconsSrc = path.join(__dirname, 'osd_icons');
    const pluginIconsDest = path.join(outputDir, 'media', 'plugins', 'mirla', 'osd_icons');

    if (fs.existsSync(pluginIconsSrc)) {
      if (!fs.existsSync(pluginIconsDest)) {
        fs.mkdirSync(pluginIconsDest, { recursive: true });
      }
      // Read all icons and copy them to the public output directory
      const icons = fs.readdirSync(pluginIconsSrc);
      icons.forEach(icon => {
        const srcFile = path.join(pluginIconsSrc, icon);
        const destFile = path.join(pluginIconsDest, icon);
        if (fs.lstatSync(srcFile).isFile()) {
          fs.copyFileSync(srcFile, destFile);
        }
      });
      console.log(`[Mirla Plugin] Copied OpenSeadragon icons to ${pluginIconsDest}`);
    } else {
      console.log(`[Mirla Plugin] NOTICE: No 'osd_icons' folder found in plugin directory. Skipping icon copy.`);
    }
    
    // ==========================================
    // 1. FILE VERIFICATION
    // ==========================================
    const collectionInputPath = path.join(inputDir, 'media', 'files', 'collection');
    const metadataPath = path.join(collectionInputPath, 'Metadata.csv');
    const protocolPath = path.join(collectionInputPath, 'Protocol.csv');
    const imagesInputPath = path.join(collectionInputPath, 'images');

    // Load the HTML template from the plugin directory
    const injectionTemplatePath = path.join(__dirname, 'item-template.html');
    if (!fs.existsSync(injectionTemplatePath)) {
      throw new Error(`[Mirla Plugin] FATAL ERROR: item-template.html not found in plugin directory.`);
    }
    const itemTemplateRaw = fs.readFileSync(injectionTemplatePath, 'utf8');

    if (!fs.existsSync(metadataPath)) {
      console.log(`[Mirla Plugin] FATAL ERROR: Metadata.csv not found at ${metadataPath}`);
      return;
    }
    if (!fs.existsSync(protocolPath)) {
      console.log(`[Mirla Plugin] FATAL ERROR: Protocol.csv not found at ${protocolPath}`);
      return;
    }

    // ==========================================
    // 2. PROTOCOL PARSING
    // ==========================================
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

    // ==========================================
    // 3. METADATA PARSING
    // ==========================================
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
    // 4. BATCH VALIDATION (FATAL ERRORS)
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

    const siteDomain = rendererInstance.siteConfig.domain;

    // Filter out rows that completely lack a PID so they don't crash the JSON
    const validCollectionData = collectionData.filter((item, index) => {
      const rowNumber = index + 2; // +2 because row 1 is the header
      const pid = item.pid;
      
      if (!pid) {
        console.log(`[Mirla Plugin] ROW ERROR (Row ${rowNumber}): Row without pid. Skipping.`);
        errorCount++;
        return false; 
      }

      // -- DYNAMIC TYPE VALIDATION --
      let rowHasTypeErrors = false;
      const allPidsStr = allPids.map(String); // To ensure safe comparisons

      for (const [attr, expectedType] of Object.entries(protocolMap)) {
        const val = item[attr];
        
        // Only validate if a value exists (allowing empty cells)
        if (val !== undefined && val !== null && val !== '') {
          const valStr = val.toString().trim(); // Trim whitespace to prevent broken URLs/IDs

          if (expectedType === 'number') {
            if (typeof val !== 'number' && isNaN(Number(val))) {
              console.log(`[Mirla Plugin] TYPE ERROR (Row ${rowNumber}, pid: ${pid}): '${attr}' must be a number, got: '${val}'`);
              rowHasTypeErrors = true;
            }
          } 
          else if (expectedType === 'link') {
            if (!valStr.startsWith('http://') && !valStr.startsWith('https://')) {
              console.log(`[Mirla Plugin] TYPE ERROR (Row ${rowNumber}, pid: ${pid}): '${attr}' must be a valid link, got: '${val}'`);
              rowHasTypeErrors = true;
            }
          } 
          else if (expectedType === 'ref') {
            const refs = valStr.split('/');
            refs.forEach(refPid => {
              if (!allPidsStr.includes(refPid.trim())) {
                console.log(`[Mirla Plugin] WARNING (Row ${rowNumber}, pid: ${pid}): '${attr}' references a pid that does not exist in the collection: '${refPid}'`);
                // Left as a warning so it doesn't break the full build, but it gets reported
              }
            });
          }
          else if (expectedType === 'youtube') {
            // A YouTube ID usually has 11 characters (letters, numbers, dashes)
            if (valStr.length < 10 || valStr.includes('youtube.com') || valStr.includes('http')) {
              console.log(`[Mirla Plugin] TYPE ERROR (Row ${rowNumber}, pid: ${pid}): '${attr}' must be only the YouTube ID, not the full URL, got: '${val}'`);
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
      
      const publicMediaUrl = `${siteDomain}/media/files/collection/images`;

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

    // ==========================================
    // 6. SAVE COLLECTION JSON & JS PAYLOAD
    // ==========================================
    
    // Process the gallery filters from config
    const galleryFiltersStr = this.config.galleryFilters || '';
    const galleryFilters = galleryFiltersStr.split(',')
                             .map(s => s.trim())
                             .filter(s => s !== '');

    const finalJsonPath = path.join(outputDir, 'media', 'files', 'collection', 'collection.json');
    const outputCollectionDir = path.dirname(finalJsonPath);
    if (!fs.existsSync(outputCollectionDir)) {
      fs.mkdirSync(outputCollectionDir, { recursive: true });
    }

    const finalExportData = {
      protocol: protocolMap,
      items: validCollectionData,
      filters: galleryFilters
    };

    // Save standard JSON (Good for external integrations/APIs)
    fs.writeFileSync(finalJsonPath, JSON.stringify(finalExportData, null, 2), 'utf8');

    // Save JS Payload (Bypasses fetch restrictions for the Svelte App)
    const jsPayloadPath = path.join(outputCollectionDir, 'collection-data.js');
    const jsPayloadContent = `window.MIRLA_COLLECTION_DATA = ${JSON.stringify(finalExportData)};`;
    fs.writeFileSync(jsPayloadPath, jsPayloadContent, 'utf8');

    // ==========================================
    // 7. GENERATE INDIVIDUAL ITEM PAGES
    // ==========================================
    const templatePageId = this.config.templatePageId;
    if (!templatePageId) {
      throw new Error("[Mirla Plugin] FATAL ERROR: No template page selected in settings.");
    }

    // Look up the page using Publii's internal cached dictionary
    const templatePage = rendererInstance.cachedItems.pages[templatePageId] || 
                         (rendererInstance.commonData.pages || []).find(p => p.id.toString() === templatePageId.toString());

    if (!templatePage) {
      throw new Error(`[Mirla Plugin] FATAL ERROR: Could not find the page with ID ${templatePageId} in the database.`);
    }

    const templateSlug = templatePage.slug;

    // Locate the rendered HTML file (Checking for both Clean URLs and Standard URLs)
    const cleanUrlPath = path.join(outputDir, templateSlug, 'index.html');
    const standardUrlPath = path.join(outputDir, `${templateSlug}.html`);
    
    let templateHtmlPath = '';
    
    if (fs.existsSync(cleanUrlPath)) {
      templateHtmlPath = cleanUrlPath;
    } else if (fs.existsSync(standardUrlPath)) {
      templateHtmlPath = standardUrlPath;
    } else {
      throw new Error(`[Mirla Plugin] FATAL ERROR: Could not find compiled HTML for template at either ${templateSlug}.html or ${templateSlug}/index.html`);
    }

    // Read the raw HTML of the template
    const rawTemplateHtml = fs.readFileSync(templateHtmlPath, 'utf8');

    // Create a base directory for all individual item pages
    const itemsOutputDir = path.join(outputDir, 'item');
    if (!fs.existsSync(itemsOutputDir)) {
      fs.mkdirSync(itemsOutputDir, { recursive: true });
    }

    // Parse excluded metadata from config (defaulting to 'pid,label' if empty)
    const excludedMetadataStr = this.config.excludedMetadata || 'pid,label';
    // Split by comma, trim whitespace, and convert to lowercase for safe comparisons
    const excludedMetadata = excludedMetadataStr.split(',').map(s => s.trim().toLowerCase());

    let pagesGenerated = 0;

    validCollectionData.forEach(item => {
      // Create the specific folder for this item using its PID
      const itemFolder = path.join(itemsOutputDir, item.pid);
      if (!fs.existsSync(itemFolder)) {
        fs.mkdirSync(itemFolder, { recursive: true });
      }

      // Prepare the images array for OpenSeadragon
      const osdImagesArray = JSON.stringify(item.images);

      // Helper to determine if it's an external URL or a local file in the collection folder
      const resolveMediaUrl = (pathOrUrl) => {
        const str = pathOrUrl.toString().trim();
        if (str.startsWith('http://') || str.startsWith('https://')) {
          return str;
        }
        // Assumes relative path from media/files/collection/
        return `${siteDomain}/media/files/collection/${str}`;
      };

      // Build the dynamic Table Rows based on Protocol
      let tableRowsHtml = '';
      for (const [attr, expectedType] of Object.entries(protocolMap)) {
        
        // Skip this attribute if it is in the exclusion list
        if (excludedMetadata.includes(attr.toLowerCase())) {
          continue; 
        }

        const val = item[attr];
        
        // Only render the row if the item actually has data for this attribute
        if (val !== undefined && val !== null && val !== '') {
          tableRowsHtml += `<tr class="mirla-table-row">\n<th class="mirla-table-header">${attr}</th>\n`;
          
          let tdContent = '';
          const valStr = val.toString().trim();

          switch (expectedType) {
            case 'link':
              tdContent = `<a href="${valStr}" target="_blank" rel="noopener noreferrer">${valStr}</a>`;
              break;
              
            case 'ref':
              // Split by / and create a link for each referenced PID
              const refs = valStr.split('/');
              const refLinks = refs.map(refPid => `<a href="${siteDomain}/item/${refPid.trim()}/" class="mirla-ref-link">${refPid.trim()}</a>`);
              tdContent = refLinks.join(' | ');
              break;

            case 'image':
              tdContent = `<img src="${resolveMediaUrl(valStr)}" alt="${attr} image" style="max-width: 100%; height: auto; border-radius: 4px;" />`;
              break;

            case 'video':
              tdContent = `
                <video controls style="max-width: 100%; max-height:600px; border-radius: 4px; background: #000;">
                  <source src="${resolveMediaUrl(valStr)}">
                  Your browser does not support the video element.
                </video>`;
              break;

            case 'audio':
              tdContent = `
                <audio controls style="width: 100%;">
                  <source src="${resolveMediaUrl(valStr)}">
                  Your browser does not support the audio element.
                </audio>`;
              break;

            case 'youtube':
              tdContent = `
                <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; border-radius: 4px;">
                  <iframe width="560" height="315" 
                          src="https://www.youtube.com/embed/${valStr}" 
                          title="YouTube video player" 
                          frameborder="0" 
                          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                          referrerpolicy="strict-origin-when-cross-origin" 
                          allowfullscreen>
                  </iframe>
                </div>`;
              break;

            case 'text':
            case 'number':
            case 'latlong':
            default:
              tdContent = valStr;
              break;
          }

          tableRowsHtml += `<td class="mirla-table-data">${tdContent}</td>\n</tr>\n`;
        }
      }

      // Populate the external template
      const itemTitle = item['label'] || item.pid;
      let finalItemHtml = itemTemplateRaw
                            .replace('{{title}}', itemTitle)
                            .replace('{{osd_images_array}}', osdImagesArray)
                            .replace('{{table_rows}}', tableRowsHtml)
                            .replace(/{{site_domain}}/g, siteDomain);

      // Inject into the Publii Page
      let modifiedHtml = rawTemplateHtml.replace('<p>[MIRLA_CONTENT]</p>', finalItemHtml);
      modifiedHtml = modifiedHtml.replace('[MIRLA_CONTENT]', finalItemHtml);

      // Write the final HTML file to the drive
      const itemHtmlPath = path.join(itemFolder, 'index.html');
      fs.writeFileSync(itemHtmlPath, modifiedHtml, 'utf8');
      
      pagesGenerated++;
    });

    console.log(`[Mirla Plugin] Page Generation: Wrote ${pagesGenerated} individual item pages to the /item/ directory.`);
  }
}

module.exports = MirlaCollectionGenerator;