// Several /insights/* endpoints return list items whose exact shape isn't pinned down by the
// API docs — sometimes a plain string, sometimes an object with a label field, sometimes an
// object with none of the fields we expect. Rendering the object directly (or via naive
// `item.label || item`) makes React call toString() on it, which prints "[object Object]" —
// exactly the bug this exists to prevent. This always returns a readable string.
const humanizeKey = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const isPlainValue = (v) => v === null || ['string', 'number', 'boolean'].includes(typeof v);

export const describeItem = (item) => {
  if (item === null || item === undefined) return '';
  if (typeof item === 'string') return item;
  if (typeof item === 'number' || typeof item === 'boolean') return String(item);

  if (typeof item === 'object') {
    // Common "here's the one field that names this thing" shapes, checked in priority order.
    const known = item.label ?? item.name ?? item.title ?? item.option_label ?? item.answer ?? item.dish ?? item.text;
    if (typeof known === 'string' && known.trim()) return known;

    // No obvious label — fall back to a plain-language "Key: value, Key: value" summary built
    // from whatever scalar fields the object actually has, rather than showing raw JSON.
    const parts = Object.entries(item)
      .filter(([key, value]) => isPlainValue(value) && value !== null && value !== '' && key !== 'id')
      .map(([key, value]) => `${humanizeKey(key)}: ${value}`);
    if (parts.length > 0) return parts.join(' · ');
  }

  return 'Unlabelled item';
};
