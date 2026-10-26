import { describe, expect, it } from 'vitest';

import {
  buildMapData,
  buildNetworkData,
  buildTimelineData,
  buildTreeData,
  buildWaffleData,
  chunk,
  filterItems,
  getCollection,
  getContext,
  getItemByPid,
  getItemImage,
  getItemsForTreeNode,
  getUniqueOptions,
  groupCounts,
  itemMatchesFilters,
  parseLatLong,
  parseMirlaDate,
  sortItems,
  splitValues,
  toDisplayValue,
  toGroupKey,
  toLabels
} from './data.js';
import { CATEGORICAL_PALETTE, colorForIndex } from './palette.js';

const items = [
  {
    pid: 'a',
    label: 'Alpha',
    year: 2001,
    tags: 'Print, Zine',
    place: 'Bogotá',
    ref: { pid: 'r1', label: 'Offset', images: [] },
    latlong: '4.7110, -74.0721',
    images: ['a.jpg'],
    thumb: 'a_thumb.webp'
  },
  {
    pid: 'b',
    label: 'Beta',
    year: '2001',
    tags: 'Print; Poster',
    place: 'Bogotá',
    ref: [{ pid: 'r1', label: 'Offset' }, { pid: 'r2', label: 'Digital' }],
    latlong: 'not a coordinate',
    images: ['b.jpg']
  },
  {
    pid: 'c',
    label: 'Gamma',
    year: 1999,
    tags: '',
    place: 'Cali',
    ref: 'r3',
    latlong: '',
    images: []
  }
];

describe('global accessors', () => {
  it('returns empty structures when the payload is missing', () => {
    expect(getCollection({})).toEqual({ protocol: {}, items: [], filters: [] });
    expect(getContext({})).toEqual({ siteDomain: '', mediaUrl: '', i18n: {} });
  });

  it('returns the payload and context safely', () => {
    const source = {
      MIRLA_COLLECTION_DATA: { protocol: { label: {} }, items: [{ pid: 'a' }] },
      MIRLA_CONTEXT: { siteDomain: 'https://x/', i18n: { all: 'All' } }
    };

    expect(getCollection(source).items).toHaveLength(1);
    expect(getContext(source).siteDomain).toBe('https://x/');
  });
});

describe('label normalization', () => {
  it('handles scalars, arrays, stubs and empty values', () => {
    expect(toLabels('  hello  ')).toEqual(['hello']);
    expect(toLabels(['a', { pid: 'b', label: 'Bee' }])).toEqual(['a', 'Bee']);
    expect(toLabels({ pid: 'c' })).toEqual(['c']);
    expect(toLabels(null)).toEqual([]);
    expect(toLabels('')).toEqual([]);
    expect(toLabels(0)).toEqual(['0']);
  });

  it('splits strings only when requested', () => {
    expect(toLabels('Print, Zine')).toEqual(['Print, Zine']);
    expect(toLabels('Print, Zine', { splitStrings: true })).toEqual(['Print', 'Zine']);
    expect(splitValues('Print; Zine')).toEqual(['Print', 'Zine']);
  });

  it('uses the bar-chart grouping semantics', () => {
    expect(toGroupKey([{ label: 'A' }, 'B'])).toBe('A, B');
    expect(toGroupKey({ label: 'Offset' })).toBe('Offset');
    expect(toGroupKey('  x  ')).toBe('x');
    expect(toGroupKey('')).toBe('');
  });

  it('uses scalar display values for tables', () => {
    expect(toDisplayValue([{ label: 'A' }, 'B'])).toBe('A, B');
    expect(toDisplayValue({ pid: 'x' })).toBe('x');
    expect(toDisplayValue(null)).toBe('');
  });
});

describe('item lookup and images', () => {
  it('matches pids as strings', () => {
    expect(getItemByPid(items, 'a')).toBe(items[0]);
    expect(getItemByPid([{ pid: 1 }], '1')).toEqual({ pid: 1 });
    expect(getItemByPid(items, 'missing')).toBeUndefined();
  });

  it('resolves full images and opts into thumbs explicitly', () => {
    expect(getItemImage(items[0])).toBe('a.jpg');
    expect(getItemImage(items[0], 0, { preferThumb: true })).toBe('a_thumb.webp');
    expect(getItemImage(items[1], 0, { preferThumb: true })).toBe('b.jpg');
    expect(getItemImage(items[2])).toBeNull();
    expect(getItemImage(null)).toBeNull();
  });
});

describe('filtering', () => {
  it('matches refs using the current joined-label semantics', () => {
    expect(itemMatchesFilters(items[0], { ref: 'Offset' })).toBe(true);
    // The current index joins multi-ref arrays with a comma and compares the
    // whole string, so an individual label does not match a multi-ref item.
    expect(itemMatchesFilters(items[1], { ref: 'Offset' })).toBe(false);
    expect(itemMatchesFilters(items[1], { ref: 'Digital' })).toBe(false);
    expect(itemMatchesFilters(items[1], { ref: 'Offset,Digital' })).toBe(true);
    expect(itemMatchesFilters(items[0], { ref: 'Digital' })).toBe(false);
  });

  it('treats empty filters as all', () => {
    expect(itemMatchesFilters(items[0], {})).toBe(true);
    expect(itemMatchesFilters(items[0], { place: '' })).toBe(true);
  });

  it('combines search and filters', () => {
    const result = filterItems(items, { query: 'beta', filters: { place: 'Bogotá' } });
    expect(result.map((item) => item.pid)).toEqual(['b']);
  });

  it('deduplicates and sorts filter options', () => {
    expect(getUniqueOptions(items, 'place')).toEqual(['Bogotá', 'Cali']);
    expect(getUniqueOptions(items, 'ref')).toEqual(['Digital', 'Offset', 'r3']);
    expect(getUniqueOptions(items, 'missing')).toEqual([]);
  });
});

describe('sorting', () => {
  it('sorts numerically when both values parse as numbers', () => {
    expect(sortItems(items, 'year', true).map((item) => item.pid)).toEqual(['c', 'a', 'b']);
    expect(sortItems(items, 'year', false).map((item) => item.pid)).toEqual(['a', 'b', 'c']);
  });

  it('sorts labels case-insensitively', () => {
    expect(sortItems(items, 'label', true).map((item) => item.pid)).toEqual(['a', 'b', 'c']);
    expect(sortItems(items, 'label', false).map((item) => item.pid)).toEqual(['c', 'b', 'a']);
  });
});

describe('coordinates and dates', () => {
  it('parses valid lat/long pairs only', () => {
    expect(parseLatLong('4.7110, -74.0721')).toEqual({ lat: 4.711, lon: -74.0721 });
    expect(parseLatLong('Bogotá')).toBeNull();
    expect(parseLatLong('4.7')).toBeNull();
    expect(parseLatLong('a,b')).toBeNull();
    expect(parseLatLong('')).toBeNull();
    expect(parseLatLong(4.7)).toBeNull();
  });

  it('groups map points and skips invalid coordinates', () => {
    const points = buildMapData(items, 'latlong');
    expect(points).toHaveLength(1);
    expect(points[0]).toMatchObject({ lat: 4.711, lon: -74.0721, count: 1 });
    expect(points[0].coordId).toBe('4.7110,-74.0721');
  });

  it('parses years and full dates', () => {
    expect(parseMirlaDate('2024')).toEqual(new Date(2024, 0, 1));
    expect(parseMirlaDate(1998)).toEqual(new Date(1998, 0, 1));
    expect(parseMirlaDate('2024-05-22')).toEqual(new Date('2024-05-22'));
    expect(parseMirlaDate('not a date')).toBeNull();
    expect(parseMirlaDate('')).toBeNull();
  });

  it('groups and sorts timeline entries', () => {
    const timeline = buildTimelineData(items, 'year');
    expect(timeline.map((entry) => entry.dateStr)).toEqual([1999, 2001, '2001']);
    expect(timeline[0].items).toHaveLength(1);
  });
});

describe('aggregations', () => {
  it('groups bar-chart counts descending', () => {
    const groups = groupCounts(items, 'tags');
    expect(groups).toEqual([
      expect.objectContaining({ key: 'Print, Zine', count: 1 }),
      expect.objectContaining({ key: 'Print; Poster', count: 1 })
    ]);
  });

  it('builds a 100-cell waffle', () => {
    const waffle = buildWaffleData(items, 'tags');
    expect(waffle.cells).toHaveLength(100);
    expect(waffle.legend.reduce((sum, group) => sum + group.count, 0)).toBe(4);
  });

  it('rolls more than ten waffle groups into Other', () => {
    const many = Array.from({ length: 12 }, (_, index) => ({
      pid: `p${index}`,
      category: `Category ${index}`
    }));
    const waffle = buildWaffleData(many, 'category');
    expect(waffle.legend).toHaveLength(10);
    expect(waffle.legend.some((group) => group.key === 'Other')).toBe(true);
    expect(waffle.cells).toHaveLength(100);
  });

  it('builds network nodes and links', () => {
    const network = buildNetworkData(items, 'place', 'tags');
    expect(network.nodes.map((node) => node.id)).toEqual([
      'Bogotá',
      'Print',
      'Zine',
      'Poster',
      'Cali'
    ]);
    expect(network.links).toHaveLength(4);
    expect(network.nodes.find((node) => node.id === 'Bogotá').count).toBe(2);
    expect(network.nodes.find((node) => node.id === 'Cali').count).toBe(1);
  });

  it('builds a tree hierarchy', () => {
    const tree = buildTreeData(items, 'place,tags');
    expect(tree.name).toBe('Root');
    expect(tree.children).toHaveLength(2);
    expect(tree.children.find((child) => child.name === 'Bogotá').children).toHaveLength(2);
  });

  it('filters items for a tree node', () => {
    const tree = buildTreeData(items, 'place,tags');
    const bogota = tree.children.find((child) => child.name === 'Bogotá');
    const offset = bogota.children.find((child) => child.name === 'Print, Zine');
    const node = {
      depth: 2,
      data: offset,
      parent: { depth: 1, data: bogota, parent: { depth: 0 } }
    };

    expect(getItemsForTreeNode(items, node, 'place,tags').map((item) => item.pid)).toEqual(['a']);
  });
});

describe('chunking', () => {
  it('never loses items or adds empty pages', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 3)).toEqual([]);
    expect(chunk([1], 0)).toEqual([[1]]);
  });
});

describe('palette', () => {
  it('cycles deterministically', () => {
    expect(colorForIndex(0)).toBe(CATEGORICAL_PALETTE[0]);
    expect(colorForIndex(9)).toBe(CATEGORICAL_PALETTE[9]);
    expect(colorForIndex(10)).toBe(CATEGORICAL_PALETTE[0]);
    expect(colorForIndex(4, 3)).toBe(CATEGORICAL_PALETTE[1]);
  });
});
