/*
 * Custom function used to generate the output of the theme variables; more about it can be found at https://getpublii.com/dev/theme-variables/
 *
 * Mirla additions:
 * - self-hosted font stacks (fontSource/fontPairing)
 * - legacy Google Fonts compatibility
 * - optional primary colors
 * - readable line-height and layout tokens
 */

const SYSTEM_SANS = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const SYSTEM_SERIF = 'Georgia, "Times New Roman", serif';
const SYSTEM_MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

const BUNDLED_FONTS = {
    current: {
        body: 'Inter',
        headings: 'Libre Baskerville',
        bodyFallback: SYSTEM_SANS,
        headingsFallback: SYSTEM_SERIF
    },
    print: {
        body: 'IBM Plex Sans',
        headings: 'Syne',
        bodyFallback: SYSTEM_SANS,
        headingsFallback: SYSTEM_SANS
    },
    system: {
        body: '',
        headings: '',
        bodyFallback: SYSTEM_SANS,
        headingsFallback: SYSTEM_SANS
    }
};

const cleanFamily = function (value) {
    return String(value || '')
        .replace(/["';{}<>]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

const quoteFamily = function (name) {
    return '"' + name + '"';
};

const stackFor = function (name, fallback) {
    const clean = cleanFamily(name);
    return clean ? quoteFamily(clean) + ', ' + fallback : fallback;
};

const sanitizeLength = function (value, fallback) {
    const clean = String(value || '').trim();
    return /^\d+(\.\d+)?(px|rem|em|%|vw|vh|ch)$/.test(clean) ? clean : fallback;
};

const sanitizeColor = function (value) {
    const clean = String(value || '').trim();
    return /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(clean) ? clean : '';
};

const clampNumber = function (value, min, max, fallback) {
    const number = parseFloat(value);
    if (Number.isNaN(number)) return fallback;
    return Math.min(Math.max(number, min), max);
};

var generateThemeVariables = function (themeConfig, postConfig, commonConfig, pageConfig) {
    const fontSource = String(themeConfig.fontSource || 'bundled');
    const fontPairing = String(themeConfig.fontPairing || 'current');

    let bodyFamily = '';
    let headingFamily = '';
    let bodyFallback = SYSTEM_SANS;
    let headingFallback = SYSTEM_SERIF;

    if (fontSource === 'bundled' && fontPairing !== 'custom') {
        const pairing = BUNDLED_FONTS[fontPairing] || BUNDLED_FONTS.current;
        bodyFamily = pairing.body;
        headingFamily = pairing.headings;
        bodyFallback = pairing.bodyFallback;
        headingFallback = pairing.headingsFallback;
    } else if (fontSource === 'system') {
        bodyFallback = SYSTEM_SANS;
        headingFallback = SYSTEM_SANS;
    } else {
        // 'google' and 'custom' use the legacy family-name fields.
        bodyFamily = themeConfig.fontBodyName;
        headingFamily = themeConfig.fontHeadingsName;
        bodyFallback = SYSTEM_SANS;
        headingFallback = SYSTEM_SERIF;
    }

    const bodyStack = stackFor(bodyFamily, bodyFallback);
    const headingStack = stackFor(headingFamily, headingFallback);

    const fontSize = clampNumber(themeConfig.fontSize, 12, 20, 16);
    const lineHeight = clampNumber(themeConfig.lineHeight, 1.2, 2, 1.5);
    const mainWidth = sanitizeLength(themeConfig.mainWidth, '1100px');
    const sidebarWidth = sanitizeLength(themeConfig.sidebarWidth, '300px');

    const rowSectionBorder = themeConfig.rowSectionBorder
        ? '--pico-border-color: color-mix(in srgb, var(--pico-background-color), white 25%);'
        : '';

    const primary = sanitizeColor(themeConfig.primaryColor);
    const primaryHover = sanitizeColor(themeConfig.primaryHoverColor) ||
        (primary ? 'color-mix(in srgb, ' + primary + ', #000 15%)' : '');

    let output = `
      :root {
            --main-width: ${mainWidth};
            --sidebar-width: ${sidebarWidth};
            --pico-font-size: ${fontSize}px;
            --pico-line-height: ${lineHeight};
            --pico-font-family: ${bodyStack};
            --pico-font-family-heading: ${headingStack};
            --mirla-font-body: ${bodyStack};
            --mirla-font-heading: ${headingStack};
            --mirla-font-mono: ${SYSTEM_MONO};
            ${rowSectionBorder}
            ${primary ? '--pico-primary: ' + primary + '; --pico-primary-background: ' + primary + '; --pico-primary-border: ' + primary + '; --pico-primary-focus: color-mix(in srgb, ' + primary + ', transparent 75%);' : ''}
            ${primaryHover ? '--pico-primary-hover: ' + primaryHover + '; --pico-primary-hover-background: ' + primaryHover + '; --pico-primary-hover-border: ' + primaryHover + ';' : ''}
      }`;

    return output;
};

module.exports = generateThemeVariables;
