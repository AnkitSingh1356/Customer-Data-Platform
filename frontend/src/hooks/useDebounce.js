import { useState, useEffect } from "react";

/**
 * Returns a debounced copy of a value that only updates after a period of inactivity.
 * Usage: wrap search input state before passing it to API calls to avoid firing a
 * request on every keystroke.
 * @param {*} value - The value to debounce (typically a string from a search input).
 * @param {number} [delay=400] - Milliseconds to wait after the last change before updating.
 * @returns {*} The debounced value, which lags behind `value` by up to `delay` ms.
 */
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    // Cancel the pending update if value changes before the delay expires
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
