// src/hooks/useDebouncedValue.ts
import { useEffect, useState } from "react";

/**
 * Returns a debounced version of a value that updates after `delay` ms of inactivity.
 * Useful for search inputs to avoid API calls on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delay = 450): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
