"use client";

import { useEffect, useState } from "react";

/**
 * Returns `value`, updated only after it's stopped changing for `delay`ms.
 * Used to keep search-driven server queries from firing on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
}
