import { useState, useCallback, useRef, useEffect } from "react";

export function useToast(duration = 3000) {
  const [toast,    setToast]  = useState(null);
  const timerRef              = useRef(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const showToast = useCallback((msg, type = "success") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ msg, type });
    timerRef.current = setTimeout(() => setToast(null), duration);
  }, [duration]);

  return { toast, showToast };
}
