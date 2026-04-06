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
    const imagesInputPath = path.join(collectionInputPath, 'images');

    const injectionTemplatePath = path.join(__dirname, 'item-template.html');
    if (!fs.existsSync(injectionTemplatePath)) {
      throw new Error(`[Mirla Plugin] FATAL ERROR: item-template.html not found in plugin directory.`);
    }
    const itemTemplateRaw = fs.readFileSync(injectionTemplatePath, 'utf8');

    if (!fs.existsSync(collectionInputPath)) {
       throw new Error(`[Mirla Plugin] FATAL ERROR: Collection folder not found at ${collectionInputPath}`);
    }

    // Identify the main table files vs secondary tables
    let mainProtocolPath = null;
    let mainMetadataPath = null;
    let secondaryProtocolFiles = [];
    let secondaryMetadataFiles = [];

    const filesInCollection = fs.readdirSync(collectionInputPath);

    filesInCollection.forEach(file => {
      if (file.toLowerCase() === 'protocol.csv') {
        mainProtocolPath = path.join(collectionInputPath, file);
      } else if (file.toLowerCase() === 'metadata.csv') {
        mainMetadataPath = path.join(collectionInputPath, file);
      } else if (file.toLowerCase().startsWith('protocol_') && file.toLowerCase().endsWith('.csv')) {
        secondaryProtocolFiles.push(path.join(collectionInputPath, file));
      } else if (file.toLowerCase().startsWith('metadata_') && file.toLowerCase().endsWith('.csv')) {
        secondaryMetadataFiles.push(path.join(collectionInputPath, file));
      }
    });

    if (!mainProtocolPath || !mainMetadataPath) {
      throw new Error("[Mirla Plugin] FATAL ERROR: Main Protocol.csv or Metadata.csv is missing.");
    }

    // ==========================================
    // 2. PARSE ALL PROTOCOLS
    // ==========================================
    const parseProtocol = (filePath) => {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = Papa.parse(raw, { header: true, skipEmptyLines: true });
      if (parsed.errors.length > 0) {
        console.log(`[Mirla Plugin] ERROR parsing Protocol: ${filePath} - ` + JSON.stringify(parsed.errors));
        return {};
      }
      const map = {};
      parsed.data.forEach(row => {
        if (row.Attribute && row.Type) {
          map[row.Attribute.trim()] = row.Type.trim().toLowerCase();
        }
      });
      return map;
    };

    // Main Protocol
    const mainProtocolMap = parseProtocol(mainProtocolPath);
    console.log("[Mirla Plugin] Loaded Main Protocol Schema.");

    // Secondary Protocols
    const secondaryProtocolMaps = {};
    secondaryProtocolFiles.forEach(file => {
      const fileName = path.basename(file, '.csv');
      const suffix = fileName.substring(9); // Removes 'Protocol_'
      secondaryProtocolMaps[suffix] = parseProtocol(file);
    });

    // Create a unified master protocol for the JSON output 
    // This allows components like mirla-table to see all possible columns
    const unifiedProtocolMap = { ...mainProtocolMap };
    Object.values(secondaryProtocolMaps).forEach(secondaryMap => {
        Object.assign(unifiedProtocolMap, secondaryMap);
    });

    // ==========================================
    // 3. PARSE ALL METADATA
    // ==========================================
    const parseMetadata = (filePath) => {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = Papa.parse(raw, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true
      });
      if (parsed.errors.length > 0) {
        console.log(`[Mirla Plugin] ERROR parsing Metadata: ${filePath} - ` + JSON.stringify(parsed.errors));
        return [];
      }
      return parsed.data;
    };

    // Main Metadata
    let collectionData = parseMetadata(mainMetadataPath);
    collectionData = collectionData.filter(item => {
      if (!item.pid) {
        console.log(`[Mirla Plugin] WARNING: Skipping row without pid in main Metadata.csv`);
        return false;
      }
      return true;
    });

    // Secondary Metadata Tables
    const secondaryTablesData = {};
    secondaryMetadataFiles.forEach(file => {
      const fileName = path.basename(file, '.csv');
      const suffix = fileName.substring(9); // Removes 'Metadata_'
      
      const rawData = parseMetadata(file);
      const dictionary = {};
      rawData.forEach(item => {
        if (item.pid) {
          dictionary[item.pid.toString().trim()] = item;
        }
      });
      
      secondaryTablesData[suffix] = dictionary;
      console.log(`[Mirla Plugin] Loaded Secondary Table: ${suffix} (${Object.keys(dictionary).length} items)`);
    });

    const mainPids = collectionData.map(d => d.pid.toString().trim());
    const uniqueMainPids = new Set(mainPids);
    if (uniqueMainPids.size !== mainPids.length) {
      throw new Error("[Mirla Plugin] FATAL ERROR: There are duplicate pids in the main Metadata.csv");
    }

    const siteDomain = rendererInstance.siteConfig.domain;
    const publicMediaUrl = `${siteDomain}/media/files/collection/images`;

    const resolveImagesForPid = (pid) => {
      const pidStr = pid.toString().trim();
      let images = [];
      const singleImageJpg = path.join(imagesInputPath, `${pidStr}.jpg`);
      const singleImagePng = path.join(imagesInputPath, `${pidStr}.png`);
      const folderPath = path.join(imagesInputPath, pidStr);
      
      if (fs.existsSync(singleImageJpg)) {
        images.push(`${publicMediaUrl}/${pidStr}.jpg`);
      } else if (fs.existsSync(singleImagePng)) {
        images.push(`${publicMediaUrl}/${pidStr}.png`);
      } else if (fs.existsSync(folderPath) && fs.lstatSync(folderPath).isDirectory()) {
        const files = fs.readdirSync(folderPath);
        files.forEach(file => {
          if (file.match(/\.(jpg|jpeg|png|webp)$/i)) {
            images.push(`${publicMediaUrl}/${pidStr}/${file}`);
          }
        });
      }
      return images;
    };

    // ==========================================
    // 4. EMBED SECONDARY DATA (RELATIONAL STUBS)
    // ==========================================
    const validCollectionData = collectionData.map((item, index) => {
      const rowNumber = index + 2;
      const pid = item.pid.toString().trim();
      item.images = resolveImagesForPid(pid);

      // Validate against the MAIN protocol
      for (const [attr, expectedType] of Object.entries(mainProtocolMap)) {
        const val = item[attr];
        
        if (val !== undefined && val !== null && val !== '') {
          const valStr = val.toString().trim();

          if (expectedType === 'number') {
            if (typeof val !== 'number' && isNaN(Number(val))) {
               console.log(`[Mirla Plugin] TYPE ERROR (Row ${rowNumber}, pid: ${pid}): '${attr}' must be a number.`);
            }
          } 
          else if (expectedType === 'link') {
            if (!valStr.startsWith('http://') && !valStr.startsWith('https://')) {
               console.log(`[Mirla Plugin] TYPE ERROR (Row ${rowNumber}, pid: ${pid}): '${attr}' must be a valid link.`);
            }
          } 
          else if (expectedType === 'youtube') {
            if (valStr.length < 10 || valStr.includes('youtube.com') || valStr.includes('http')) {
               console.log(`[Mirla Plugin] TYPE ERROR (Row ${rowNumber}, pid: ${pid}): '${attr}' must be only the YouTube ID.`);
            }
          }
          else if (expectedType.startsWith('ref')) {
             const refs = valStr.split('/');
             const parsedRefs = [];

             refs.forEach(refPid => {
               const cleanRefPid = refPid.trim();
               
               if (expectedType === 'ref') {
                 if (!mainPids.includes(cleanRefPid)) {
                   console.log(`[Mirla Plugin] WARNING (Row ${rowNumber}): '${attr}' references missing pid: '${cleanRefPid}'`);
                 }
                 parsedRefs.push(cleanRefPid);
               } 
               else if (expectedType.includes(':')) {
                 const targetTableSuffix = expectedType.split(':')[1].trim();
                 
                 if (secondaryTablesData[targetTableSuffix]) {
                   const targetRecord = secondaryTablesData[targetTableSuffix][cleanRefPid];
                   
                   if (targetRecord) {
                     const stub = {
                       pid: cleanRefPid,
                       label: targetRecord.label || cleanRefPid,
                       images: resolveImagesForPid(cleanRefPid) 
                     };
                     parsedRefs.push(stub);
                   } else {
                     console.log(`[Mirla Plugin] WARNING (Row ${rowNumber}): Target pid '${cleanRefPid}' not found in Metadata_${targetTableSuffix}.csv`);
                     parsedRefs.push(cleanRefPid); 
                   }
                 } else {
                     console.log(`[Mirla Plugin] WARNING (Row ${rowNumber}): Protocol asks for table '${targetTableSuffix}', but Metadata_${targetTableSuffix}.csv was not found.`);
                     parsedRefs.push(cleanRefPid);
                 }
               }
             });
             
             item[attr] = parsedRefs.length === 1 ? parsedRefs[0] : parsedRefs;
          }
        }
      }
      return item;
    });

    for (const [suffix, dictionary] of Object.entries(secondaryTablesData)) {
      Object.values(dictionary).forEach(item => {
        item._collection_type = suffix;
        item.images = resolveImagesForPid(item.pid);
        validCollectionData.push(item);
      });
    }

    // ==========================================
    // 5. SAVE COLLECTION JSON & JS PAYLOAD
    // ==========================================
    const finalJsonPath = path.join(outputDir, 'media', 'files', 'collection', 'collection.json');
    const outputCollectionDir = path.dirname(finalJsonPath);
    if (!fs.existsSync(outputCollectionDir)) {
      fs.mkdirSync(outputCollectionDir, { recursive: true });
    }

    // Save with the UNIFIED protocol so frontend components know all possible fields
    const finalExportData = {
      protocol: unifiedProtocolMap,
      items: validCollectionData
    };

    fs.writeFileSync(finalJsonPath, JSON.stringify(finalExportData, null, 2), 'utf8');

    const jsPayloadPath = path.join(outputCollectionDir, 'collection-data.js');
    const jsPayloadContent = `window.MIRLA_COLLECTION_DATA = ${JSON.stringify(finalExportData)};`;
    fs.writeFileSync(jsPayloadPath, jsPayloadContent, 'utf8');

    // ==========================================
    // 6. GENERATE INDIVIDUAL ITEM PAGES
    // ==========================================
    const templatePageId = this.config.templatePageId;
    if (!templatePageId) {
      throw new Error("[Mirla Plugin] FATAL ERROR: No template page selected in settings.");
    }

    const templatePage = rendererInstance.cachedItems.pages[templatePageId] || 
                         (rendererInstance.commonData.pages || []).find(p => p.id.toString() === templatePageId.toString());

    if (!templatePage) {
      throw new Error(`[Mirla Plugin] FATAL ERROR: Could not find the page with ID ${templatePageId} in the database.`);
    }

    const templateSlug = templatePage.slug;

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

    const rawTemplateHtml = fs.readFileSync(templateHtmlPath, 'utf8');
    const itemsOutputDir = path.join(outputDir, 'item');
    if (!fs.existsSync(itemsOutputDir)) {
      fs.mkdirSync(itemsOutputDir, { recursive: true });
    }

    const excludedMetadataStr = this.config.excludedMetadata || 'pid,label';
    const excludedMetadata = excludedMetadataStr.split(',').map(s => s.trim().toLowerCase());

    let pagesGenerated = 0;

    validCollectionData.forEach(item => {
      const itemFolder = path.join(itemsOutputDir, item.pid);
      if (!fs.existsSync(itemFolder)) {
        fs.mkdirSync(itemFolder, { recursive: true });
      }

      const osdImagesArray = JSON.stringify(item.images || []);

      const resolveMediaUrl = (pathOrUrl) => {
        const str = pathOrUrl.toString().trim();
        if (str.startsWith('http://') || str.startsWith('https://')) {
          return str;
        }
        return `${siteDomain}/media/files/collection/${str}`;
      };

      let tableRowsHtml = '';
      
      // Select the correct protocol based on the item's type
      let activeProtocolMap = mainProtocolMap;
      if (item._collection_type && secondaryProtocolMaps[item._collection_type]) {
          activeProtocolMap = secondaryProtocolMaps[item._collection_type];
      }

      for (const [attr, expectedType] of Object.entries(activeProtocolMap)) {
        
        if (excludedMetadata.includes(attr.toLowerCase())) {
          continue; 
        }

        const val = item[attr];
        
        if (val !== undefined && val !== null && val !== '') {
          tableRowsHtml += `<tr class="mirla-table-row">
<th class="mirla-table-header">${attr}</th>
`;
          let tdContent = '';

          const valIsArray = Array.isArray(val);
          const iterableVal = valIsArray ? val : [val];

          if (expectedType === 'link') {
             tdContent = `<a href="${val}" target="_blank" rel="noopener noreferrer">${val}</a>`;
          }
          else if (expectedType === 'image') {
             tdContent = `<img src="${resolveMediaUrl(val)}" alt="${attr} image" style="max-width: 100%; height: auto; border-radius: 4px;" />`;
          }
          else if (expectedType === 'video') {
             tdContent = `
                <video controls style="max-width: 100%; max-height:600px; border-radius: 4px; background: #000;">
                  <source src="${resolveMediaUrl(val)}">
                </video>`;
          }
          else if (expectedType === 'audio') {
             tdContent = `
                <audio controls style="width: 100%;">
                  <source src="${resolveMediaUrl(val)}">
                </audio>`;
          }
          else if (expectedType === 'youtube') {
             tdContent = `
                <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; border-radius: 4px;">
                  <iframe width="560" height="315" 
                          src="https://www.youtube.com/embed/${val}" 
                          frameborder="0" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" allowfullscreen>
                  </iframe>
                </div>`;
          }
          else if (expectedType.startsWith('ref')) {
             const htmlLinks = iterableVal.map(ref => {
               if (typeof ref === 'object' && ref !== null && ref.pid) {
                 return `<a href="${siteDomain}/item/${ref.pid}/index.html" class="mirla-ref-link">${ref.label}</a>`;
               } else {
                 return `<a href="${siteDomain}/item/${ref}/index.html" class="mirla-ref-link">${ref}</a>`;
               }
             });
             tdContent = htmlLinks.join(' | ');
          }
          else {
             tdContent = Array.isArray(val) ? val.join(', ') : val.toString();
          }

          tableRowsHtml += `<td class="mirla-table-data">${tdContent}</td>
</tr>
`;
        }
      }

      const itemTitle = item['label'] || item.pid;
      
      let finalItemHtml = itemTemplateRaw
                            .replace('{{title}}', itemTitle)
                            .replace('{{osd_images_array}}', osdImagesArray)
                            .replace('{{table_rows}}', tableRowsHtml)
                            .replace(/{{site_domain}}/g, siteDomain);

      let modifiedHtml = rawTemplateHtml.replace('<p>[MIRLA_CONTENT]</p>', finalItemHtml);
      modifiedHtml = modifiedHtml.replace('[MIRLA_CONTENT]', finalItemHtml);

      // --- NEW FEATURE: Replace the <title> tag in the HTML head ---
      const siteTitleRegex = /<title>(.*?)<\/title>/i;
      const match = modifiedHtml.match(siteTitleRegex);
      if (match) {
        // Extract the original site name (usually follows a dash or pipe)
        const originalTitle = match[1];
        const titleParts = originalTitle.split(/[-|]/);
        const siteName = titleParts.length > 1 ? ` - ${titleParts[titleParts.length - 1].trim()}` : '';
        
        const newTitle = `<title>${itemTitle}${siteName}</title>`;
        modifiedHtml = modifiedHtml.replace(siteTitleRegex, newTitle);
      }

      const itemHtmlPath = path.join(itemFolder, 'index.html');
      fs.writeFileSync(itemHtmlPath, modifiedHtml, 'utf8');
      
      pagesGenerated++;
    });

    console.log(`[Mirla Plugin] Page Generation: Wrote ${pagesGenerated} individual item pages to the /item/ directory.`);
  }
}

module.exports = MirlaCollectionGenerator;