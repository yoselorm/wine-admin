import { useEffect, useState } from 'react';

// For any search box whose value drives a network request (as opposed to filtering an
// already-fetched list client-side) — waits until typing pauses before the value changes,
// so a fetch fires once per pause instead of once per keystroke.
export const useDebouncedValue = (value, delayMs = 400) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
};
