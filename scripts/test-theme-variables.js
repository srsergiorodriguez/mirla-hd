#!/usr/bin/env node
/*
 * Checks the theme's pure generators and the configuration contract.
 * These are data/config checks, not visual tests.
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const themeDir = path.join(__dirname, '..', 'input', 'themes', 'mirlaTheme');
const generateThemeVariables = require(path.join(themeDir, 'theme-variables.js'));
const generateOverride = require(path.join(themeDir, 'visual-override.js'));
const config = JSON.parse(fs.readFileSync(path.join(themeDir, 'config.json'), 'utf8'));

const base = {
    mainWidth: '1100px',
    sidebarWidth: '300px',
    fontSize: '16',
    lineHeight: '1.5',
    fontSource: 'bundled',
    fontPairing: 'current',
    rowSectionBorder: true,
    fontBodyName: 'Inter',
    fontHeadingsName: 'Libre Baskerville',
    primaryColor: '',
    primaryHoverColor: ''
};

const fields = new Set(config.customConfig.map((field) => field.name));

// Configuration contract
for (const name of [
    'fontSource', 'fontPairing', 'lineHeight', 'customCSS',
    'primaryColor', 'primaryHoverColor',
    'printPageWidth', 'printPageHeight',
    'printMarginTop', 'printMarginBottom', 'printMarginOuter', 'printMarginInner',
    'printFontBody', 'printFontHeading', 'printFontCode', 'printImageTreatment'
]) {
    assert(fields.has(name), `Missing theme config field: ${name}`);
}

// Bundled fonts
const fontsCss = fs.readFileSync(path.join(themeDir, 'assets', 'css', 'fonts.css'), 'utf8');
const fontFiles = fs.readdirSync(path.join(themeDir, 'assets', 'fonts')).filter((file) => file.endsWith('.woff2'));
assert(fontFiles.length >= 9, 'Expected at least 9 bundled woff2 files');
assert(fs.existsSync(path.join(themeDir, 'assets', 'fonts', 'README.md')), 'Missing fonts README');
for (const family of ['Inter', 'Libre Baskerville', 'IBM Plex Sans', 'Syne', 'Source Code Pro']) {
    assert(fontsCss.includes(`font-family: '${family}'`), `Missing @font-face for ${family}`);
}

const bundled = generateThemeVariables(base, {}, {}, {});
assert(bundled.includes('--pico-font-family: "Inter"'), 'Bundled body font is not Inter');
assert(bundled.includes('--pico-font-family-heading: "Libre Baskerville"'), 'Bundled heading font is not Libre Baskerville');
assert(!bundled.includes('--pico-primary'), 'No custom primary color should be emitted by default');

const printPairing = generateThemeVariables({ ...base, fontPairing: 'print' }, {}, {}, {});
assert(printPairing.includes('"IBM Plex Sans"'), 'Print pairing body font missing');
assert(printPairing.includes('"Syne"'), 'Print pairing heading font missing');

const system = generateThemeVariables({ ...base, fontSource: 'system' }, {}, {}, {});
assert(system.includes('system-ui'), 'System font stack missing');

const google = generateThemeVariables({
    ...base,
    fontSource: 'google',
    fontBodyName: 'Source Sans 3',
    fontHeadingsName: 'Source Serif 4'
}, {}, {}, {});
assert(google.includes('"Source Sans 3"'), 'Legacy Google body font missing');
assert(google.includes('"Source Serif 4"'), 'Legacy Google heading font missing');

const customPairing = generateThemeVariables({
    ...base,
    fontPairing: 'custom',
    fontBodyName: 'My Body',
    fontHeadingsName: 'My Heading'
}, {}, {}, {});
assert(customPairing.includes('"My Body"'), 'Custom pairing body font missing');
assert(customPairing.includes('"My Heading"'), 'Custom pairing heading font missing');

const colors = generateThemeVariables({ ...base, primaryColor: '#ff3366' }, {}, {}, {});
assert(colors.includes('--pico-primary: #ff3366'), 'Primary color missing');
assert(colors.includes('--pico-primary-background: #ff3366'), 'Primary background missing');
assert(colors.includes('--pico-primary-hover: color-mix'), 'Derived hover color missing');

const invalidColor = generateThemeVariables({ ...base, primaryColor: 'red; } body { display:none' }, {}, {}, {});
assert(!invalidColor.includes('display:none'), 'Invalid color was not sanitized');

const customCSS = generateOverride({ customCSS: '@font-face { font-family: Test; }' });
assert(customCSS.includes('@font-face'), 'customCSS is not appended');

const printTemplate = fs.readFileSync(path.join(themeDir, 'page-print.hbs'), 'utf8');
for (const token of ['fonts.css', 'printPageWidth', 'printFontBody', 'printImageTreatment']) {
    assert(printTemplate.includes(token), `Print template does not use ${token}`);
}

const headTemplate = fs.readFileSync(path.join(themeDir, 'partials', 'head.hbs'), 'utf8');
assert(headTemplate.includes('fonts.css'), 'Head does not load fonts.css');
assert(headTemplate.includes("fontSource") && headTemplate.includes('google'), 'Head does not gate Google Fonts');

console.log('[test-theme-variables] OK');
console.log('  config fields :', fields.size);
console.log('  bundled fonts : Inter, Libre Baskerville, IBM Plex Sans, Syne, Source Code Pro');
console.log('  print template:', 'self-hosted fonts + print settings');
