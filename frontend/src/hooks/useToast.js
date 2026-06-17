import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Manages a single transient toast notification with automatic dismissal.
 * Usage: call showToast(msg, type) anywhere in the component; the toast
 * auto-dismisses after `duration` ms. Each new call resets the timer so
 * rapid actions never stack multiple toasts.
 * @param {number} [duration=3000] - How long in milliseconds the toast is visible.
 * @returns {{ toast: {msg: string, type: string}|null, showToast: function }} -
 *   `toast` is the current notification object (null when nothing is shown);
 *   `showToast(msg, type)` triggers a new toast and resets the dismiss timer.
 */
export function useToast(duration = 3000) {
  const [toast,    setToast]  = useState(null);
  // Ref keeps the timer ID across renders without causing re-renders
  const timerRef              = useRef(null);

  // Clear any pending timer on unmount to avoid state updates on dead component
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const showToast = useCallback((msg, type = "success") => {
    // Dismiss any in-flight toast before starting a fresh timer
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ msg, type });
    timerRef.current = setTimeout(() => setToast(null), duration);
  }, [duration]);

  return { toast, showToast };
}
