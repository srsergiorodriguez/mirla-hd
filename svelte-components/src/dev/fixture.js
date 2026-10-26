/**
 * Synthetic collection for the component harness.
 * Images are inline SVG data URLs so the harness works offline.
 */

function makeImage(label, background) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <rect width="400" height="400" fill="${background}"/>
    <circle cx="200" cy="170" r="80" fill="rgba(255,255,255,0.35)"/>
    <text x="200" y="330" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#111">${label}</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const imageA1 = makeImage('Alpha 1', '#e6d800');
const imageA2 = makeImage('Alpha 2', '#0bb4ff');
const imageB = makeImage('Beta', '#50e991');
const imageD = makeImage('Delta', '#ffa300');
const imageE = makeImage('Epsilon', '#dc0ab4');
const imageTecnica = makeImage('Offset', '#b3d4ff');

const protocol = {
  pid: { type: 'pid', description: 'Persistent identifier' },
  label: { type: 'label', description: 'Display name' },
  place: { type: 'text', description: 'Place of publication' },
  type: { type: 'text', description: 'Main content type' },
  year: { type: 'date', description: 'Publication year' },
  tags: { type: 'text', description: 'Comma-separated tags' },
  ref: { type: 'ref', description: 'Related items' },
  latlong: { type: 'latlong', description: 'Latitude, longitude' }
};

const items = [
  {
    pid: 'a',
    label: 'Alpha',
    place: 'Bogotá',
    type: 'Zine',
    year: 2001,
    tags: 'Print, Zine',
    ref: { pid: 'tec-1', label: 'Offset', images: [] },
    latlong: '4.7110, -74.0721',
    images: [imageA1, imageA2],
    thumb: imageA1
  },
  {
    pid: 'b',
    label: 'Beta',
    place: 'Bogotá',
    type: 'Poster',
    year: '2001',
    tags: 'Print; Poster',
    ref: 'tec-1',
    latlong: '4.7110, -74.0721',
    images: [imageB],
    thumb: imageB
  },
  {
    pid: 'c',
    label: 'Gamma',
    place: 'Cali',
    type: 'Book',
    year: 1999,
    tags: '',
    ref: '',
    latlong: '',
    images: []
  },
  {
    pid: 'd',
    label: 'Delta',
    place: 'Medellín',
    type: 'Zine',
    year: 2010,
    tags: 'Zine',
    ref: '',
    latlong: '6.2442, -75.5812',
    images: [imageD],
    thumb: imageD
  },
  {
    pid: 'e',
    label: 'Epsilon',
    place: 'Bogotá',
    type: 'Book',
    year: 2020,
    tags: 'Print',
    ref: '',
    latlong: '4.7110, -74.0721',
    images: [imageE],
    thumb: imageE
  },
  {
    pid: 'f',
    label: 'Zeta with a considerably long label for wrapping checks',
    place: 'Cali',
    type: 'Poster',
    year: 2022,
    tags: 'Poster',
    ref: '',
    latlong: '3.4516, -76.5320',
    images: [imageB]
  },
  {
    pid: 'tec-1',
    label: 'Offset',
    place: '',
    type: 'Printing technique',
    year: '',
    tags: '',
    ref: '',
    latlong: '',
    images: [imageTecnica],
    thumb: imageTecnica,
    _collection_type: 'Tecnica'
  }
];

export const collection = { protocol, items, filters: ['place', 'type'] };

export const context = {
  siteDomain: 'https://example.org/mirla-hd/',
  mediaUrl: 'https://example.org/mirla-hd/media/files/',
  i18n: {
    searchPlaceholder: 'Search...',
    resultsFound: 'results found',
    all: 'All',
    clearSearch: 'Clear search',
    downloadCSV: 'Download CSV',
    noRecordsFound: 'No records found.',
    collectionMetadata: 'Collection Metadata',
    dataDictionary: 'Data Dictionary',
    protocolAttr: 'Attribute',
    protocolType: 'Data Type',
    protocolDesc: 'Description & Rules'
  }
};
