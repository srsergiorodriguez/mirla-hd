/**
 * Pure data helpers shared by the Mirla custom elements.
 *
 * Rules:
 * - these functions never read `window` unless an explicit source is passed;
 * - they preserve the existing component behavior (including quirks);
 * - anything that depends on the DOM, D3, or Publii belongs in a component,
 *   not here.
 */

import { colorForIndex } from './palette.js';

export const EMPTY_COLLECTION = Object.freeze({ protocol: {}, items: [] });

/**
 * Safe access to the global payload.
 * @param {object} [source] usually `window`
 * @returns {{protocol: object, items: Array<object>, filters: string[]}}
 */
export function getCollection(source = globalThis) {
  const data = source && source.MIRLA_COLLECTION_DATA;
  if (!data || typeof data !== 'object') {
    return { protocol: {}, items: [], filters: [] };
  }

  return {
    protocol: data.protocol && typeof data.protocol === 'object' ? data.protocol : {},
    items: Array.isArray(data.items) ? data.items : [],
    filters: Array.isArray(data.filters) ? data.filters : []
  };
}

/**
 * Safe access to the theme-injected context.
 * @param {object} [source] usually `window`
 * @returns {{siteDomain: string, mediaUrl: string, i18n: object}}
 */
export function getContext(source = globalThis) {
  const context = (source && source.MIRLA_CONTEXT) || {};

  return {
    siteDomain: typeof context.siteDomain === 'string' ? context.siteDomain : '',
    mediaUrl: typeof context.mediaUrl === 'string' ? context.mediaUrl : '',
    i18n: context.i18n && typeof context.i18n === 'object' ? context.i18n : {}
  };
}

/**
 * Merge the injected translations over a set of defaults.
 * @param {object} [source]
 * @param {object} [defaults]
 */
export function getI18n(source = globalThis, defaults = {}) {
  return { ...defaults, ...getContext(source).i18n };
}

export function isRefStub(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value) && 'pid' in value;
}

/**
 * Human label for a scalar or a reference stub.
 */
export function labelFor(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    return String(value.label ?? value.pid ?? '').trim();
  }
  return String(value).trim();
}

/**
 * Normalize a value to a list of labels.
 *
 * `splitStrings` is opt-in because components historically disagree:
 * galleries/waffles split "A, B" into two values, while the index filters and
 * the bar chart treat it as one value.
 *
 * @param {*} value
 * @param {{splitStrings?: boolean}} [options]
 * @returns {string[]}
 */
export function toLabels(value, options = {}) {
  const { splitStrings = false } = options;

  if (value === null || value === undefined || value === '') return [];

  if (Array.isArray(value)) {
    return value.flatMap((entry) => toLabels(entry, options)).filter(Boolean);
  }

  if (typeof value === 'object') {
    const label = labelFor(value);
    return label ? [label] : [];
  }

  const text = String(value).trim();
  if (!text) return [];

  if (splitStrings) {
    return text
      .split(/[;,]+/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [text];
}

/**
 * Multi-value helper used by inline galleries, waffles and networks.
 */
export function splitValues(value) {
  return toLabels(value, { splitStrings: true });
}

/**
 * Scalar display value used by tables, search and sorting.
 */
export function toDisplayValue(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return toLabels(value).join(', ');
  if (typeof value === 'object') return labelFor(value);
  return String(value);
}

/**
 * Grouping key used by the bar chart. Arrays are joined, not split.
 */
export function toGroupKey(value) {
  if (value === null || value === undefined || value === '') return '';
  if (Array.isArray(value)) return toLabels(value).join(', ');
  if (typeof value === 'object') return labelFor(value);
  return String(value).trim();
}

export function getItemByPid(items, pid) {
  return items.find((item) => String(item.pid) === String(pid));
}

/**
 * Resolve an item image. The thumb is only preferred when explicitly requested:
 * the index, gallery header, preview and compare components historically use
 * the full image.
 */
export function getItemImage(item, index = 0, options = {}) {
  const { preferThumb = false } = options;

  if (!item) return null;
  if (preferThumb && item.thumb) return item.thumb;

  const images = Array.isArray(item.images) ? item.images : [];
  return images[index] || null;
}

export function getItemLabel(item) {
  if (!item) return '';
  return item.label || item.pid || '';
}

/**
 * Current index search behavior: every value is stringified and compared.
 * Objects therefore match "[object Object]" rather than their label; this is
 * preserved intentionally until a separate search-improvement task.
 */
export function itemMatchesQuery(item, query) {
  const normalized = String(query || '').trim().toLowerCase();
  if (!normalized) return true;

  return Object.values(item).some((value) =>
    String(value).toLowerCase().includes(normalized)
  );
}

/**
 * Current index filter behavior: refs/arrays compare by label or pid.
 */
export function itemMatchesFilters(item, filters = {}) {
  return Object.entries(filters).every(([key, value]) => {
    if (!value) return true;

    const itemValue = item[key];
    let stringValue = '';

    if (Array.isArray(itemValue)) {
      stringValue = itemValue
        .map((entry) => (entry && typeof entry === 'object' ? entry.label || entry.pid : String(entry)))
        .join(',');
    } else if (itemValue && typeof itemValue === 'object') {
      stringValue = itemValue.label || itemValue.pid;
    } else {
      stringValue = String(itemValue || '');
    }

    return stringValue === String(value);
  });
}

export function filterItems(items, { query = '', filters = {} } = {}) {
  return items.filter(
    (item) => itemMatchesQuery(item, query) && itemMatchesFilters(item, filters)
  );
}

/**
 * Current index filter option behavior: no comma splitting.
 */
export function getUniqueOptions(items, key) {
  const options = items.flatMap((item) => {
    const value = item[key];
    if (value === undefined || value === null || value === '') return [];
    return toLabels(value);
  });

  return [...new Set(options)].sort();
}

/**
 * Current table sort behavior: numeric when both sides parse as numbers,
 * otherwise case-insensitive string comparison.
 */
export function sortItems(items, key, ascending = true) {
  if (!key) return items;

  return [...items].sort((a, b) => {
    const valueA = String(a[key] || '').toLowerCase();
    const valueB = String(b[key] || '').toLowerCase();

    const numberA = parseFloat(valueA);
    const numberB = parseFloat(valueB);

    if (!Number.isNaN(numberA) && !Number.isNaN(numberB)) {
      return ascending ? numberA - numberB : numberB - numberA;
    }

    if (valueA < valueB) return ascending ? -1 : 1;
    if (valueA > valueB) return ascending ? 1 : -1;
    return 0;
  });
}

/**
 * Current map parsing behavior: one comma, two finite numbers.
 */
export function parseLatLong(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') return null;

  const parts = value.split(',');
  if (parts.length !== 2) return null;

  const lat = parseFloat(parts[0]);
  const lon = parseFloat(parts[1]);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

  return { lat, lon };
}

/**
 * Group valid coordinates for the map component.
 * @returns {Array<{coordId: string, lat: number, lon: number, items: Array<object>, count: number}>}
 */
export function buildMapData(items, coordKey) {
  if (!coordKey || items.length === 0) return [];

  const groups = new Map();

  items.forEach((item) => {
    const parsed = parseLatLong(item[coordKey]);
    if (!parsed) return;

    const coordId = `${parsed.lat.toFixed(4)},${parsed.lon.toFixed(4)}`;
    if (!groups.has(coordId)) groups.set(coordId, { ...parsed, items: [] });
    groups.get(coordId).items.push(item);
  });

  return [...groups.entries()].map(([coordId, group]) => ({
    coordId,
    lat: group.lat,
    lon: group.lon,
    items: group.items,
    count: group.items.length
  }));
}

/**
 * Current timeline date parsing behavior.
 */
export function parseMirlaDate(value) {
  if (!value) return null;

  if (
    (typeof value === 'number' && value > 1000 && value < 2100) ||
    (typeof value === 'string' && /^\d{4}$/.test(value))
  ) {
    return new Date(parseInt(value, 10), 0, 1);
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Group items by a key using the bar-chart semantics.
 * @returns {Array<{key: string, count: number, items: Array<object>}>}
 */
export function groupCounts(items, key) {
  if (!key || items.length === 0) return [];

  const groups = new Map();

  items.forEach((item) => {
    const groupKey = toGroupKey(item[key]);
    if (!groupKey) return;
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey).push(item);
  });

  return [...groups.entries()]
    .map(([groupKey, groupItems]) => ({
      key: groupKey,
      count: groupItems.length,
      items: groupItems
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Port of the waffle chart's proportional 100-cell layout.
 * @returns {{cells: Array<object>, legend: Array<object>}}
 */
export function buildWaffleData(items, key, paletteSize = 10) {
  if (!key || items.length === 0) return { cells: [], legend: [] };

  const itemMap = new Map();
  let totalValid = 0;

  items.forEach((item) => {
    splitValues(item[key]).forEach((value) => {
      if (!itemMap.has(value)) itemMap.set(value, []);
      itemMap.get(value).push(item);
      totalValid += 1;
    });
  });

  if (totalValid === 0) return { cells: [], legend: [] };

  let groups = [...itemMap.entries()].map(([groupKey, groupItems]) => {
    const quota = (groupItems.length / totalValid) * 100;
    return {
      key: groupKey,
      items: groupItems,
      count: groupItems.length,
      quota,
      int: Math.floor(quota),
      remainder: quota - Math.floor(quota)
    };
  });

  groups.sort((a, b) => b.count - a.count);

  if (groups.length > 10) {
    const top = groups.slice(0, 9);
    const otherItems = groups.slice(9).flatMap((group) => group.items);
    const otherQuota = (otherItems.length / totalValid) * 100;

    top.push({
      key: 'Other',
      items: otherItems,
      count: otherItems.length,
      quota: otherQuota,
      int: Math.floor(otherQuota),
      remainder: otherQuota - Math.floor(otherQuota)
    });

    groups = top;
  }

  const allocated = groups.reduce((sum, group) => sum + group.int, 0);
  const remainders = [...groups].sort((a, b) => b.remainder - a.remainder);

  for (let i = 0; i < 100 - allocated; i += 1) {
    if (remainders[i]) remainders[i].int += 1;
  }

  const cells = [];
  groups.forEach((group, index) => {
    const color = colorForIndex(index, paletteSize);
    group.color = color;

    for (let i = 0; i < group.int; i += 1) {
      cells.push({ category: group.key, items: group.items, color });
    }
  });

  return { cells, legend: groups };
}

/**
 * Port of the network graph's node/link construction.
 */
export function buildNetworkData(items, sourceKey, targetKey) {
  if (!sourceKey || !targetKey || items.length === 0) {
    return { nodes: [], links: [] };
  }

  const nodeMap = new Map();
  const links = [];

  items.forEach((item) => {
    const sources = splitValues(item[sourceKey]);
    const targets = splitValues(item[targetKey]);

    sources.forEach((source) => {
      if (!nodeMap.has(source)) nodeMap.set(source, { id: source, type: 'source', count: 0 });
      nodeMap.get(source).count += 1;

      targets.forEach((target) => {
        if (!nodeMap.has(target)) nodeMap.set(target, { id: target, type: 'target', count: 0 });
        nodeMap.get(target).count += 1;
        links.push({ source, target });
      });
    });
  });

  return { nodes: [...nodeMap.values()], links };
}

/**
 * Port of the dendrogram rollup. Returns a plain hierarchy; the component still
 * uses d3.hierarchy/d3.tree for layout.
 */
export function buildTreeData(items, keys) {
  if (!keys || items.length === 0) return null;

  const keyList = keys
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (keyList.length === 0) return null;

  function rollup(entries, depth) {
    if (depth >= keyList.length) return entries.length;

    const groups = new Map();
    entries.forEach((item) => {
      const value = String(item[keyList[depth]] || 'N/A');
      if (!groups.has(value)) groups.set(value, []);
      groups.get(value).push(item);
    });

    return [...groups.entries()].map(([name, groupItems]) => {
      const value = rollup(groupItems, depth + 1);
      return typeof value === 'number'
        ? { name, value }
        : { name, children: value };
    });
  }

  return { name: 'Root', children: rollup(items, 0) };
}

/**
 * Port of the timeline grouping.
 */
export function buildTimelineData(items, dateKey) {
  if (!dateKey || items.length === 0) return [];

  const groups = new Map();
  items.forEach((item) => {
    const dateStr = item[dateKey];
    if (!groups.has(dateStr)) groups.set(dateStr, []);
    groups.get(dateStr).push(item);
  });

  return [...groups.entries()]
    .map(([dateStr, groupItems]) => ({
      date: parseMirlaDate(dateStr),
      dateStr,
      items: groupItems
    }))
    .filter((entry) => entry.date !== null)
    .sort((a, b) => a.date - b.date);
}

/**
 * Items matching a tree node, using the current tree filter semantics.
 */
export function getItemsForTreeNode(items, node, keys) {
  if (!node || node.depth === 0) return items;

  const keyList = keys
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  const filters = [];
  let currentNode = node;

  while (currentNode && currentNode.depth > 0) {
    filters.push({
      key: keyList[currentNode.depth - 1],
      value: currentNode.data.name
    });
    currentNode = currentNode.parent;
  }

  return items.filter((item) =>
    filters.every((filter) => String(item[filter.key] || 'N/A') === String(filter.value))
  );
}

/**
 * Chunk an array into pages without losing items or adding empty pages.
 */
export function chunk(items, size) {
  const pageSize = Math.max(1, parseInt(size, 10) || 1);
  const pages = [];
  for (let index = 0; index < items.length; index += pageSize) {
    pages.push(items.slice(index, index + pageSize));
  }
  return pages;
}
