# Bundled fonts

These fonts are self-hosted so Mirla works without a Google Fonts request.
All are licensed under the SIL Open Font License; the full license texts are in
`licenses/`.

| Font | Files | Weights/styles | Source |
|---|---|---|---|
| Inter | `inter-latin-*.woff2` | 400, 700 normal | `@fontsource/inter@5` |
| Libre Baskerville | `libre-baskerville-latin-700-normal.woff2` | 700 normal | `@fontsource/libre-baskerville@5` |
| IBM Plex Sans | `ibm-plex-sans-latin-*.woff2` | 400, 400 italic, 700 normal | `@fontsource/ibm-plex-sans@5` |
| Syne | `syne-latin-wght-normal.woff2` | variable 400–800 | `@fontsource-variable/syne@5` |
| Source Code Pro | `source-code-pro-latin-*.woff2` | 400, 700 normal | `@fontsource/source-code-pro@5` |

The files are the Latin subsets. They cover Spanish/Portuguese accents. Other
scripts fall back to the system font stack.

The `@font-face` rules live in `assets/css/fonts.css` and are linked by the web
head and the print templates. Do not rename the files without updating that
stylesheet.
