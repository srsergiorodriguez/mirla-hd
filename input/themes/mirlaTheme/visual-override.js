// Custom function used to generate the output of the override css file; its content is appended to the end of the file; more about it can be found at https://getpublii.com/dev/visual-overrides/#visual-overrides

var generateOverride = function (params) {
    let output = '';

    // Advanced theme CSS. This is intentionally raw: it is the escape hatch
    // for @font-face declarations, extra tokens, and small layout overrides.
    if (params.customCSS && String(params.customCSS).trim() !== '') {
        output += `\n/* --- Mirla custom CSS --- */\n${params.customCSS}\n`;
    }

    return output;
}

module.exports = generateOverride;
