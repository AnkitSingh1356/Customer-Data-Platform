import { useState, useRef, useEffect } from "react";

/**
 * Viewport-safe custom select dropdown.
 * Renders a fixed-position panel that never overflows the viewport edges.
 * Drop-in replacement for native <select> in filter/toolbar contexts.
 *
 * @param {string}   props.value     - Currently selected option value
 * @param {function} props.onChange  - Called with the new value string on selection
 * @param {Array}    props.options   - Array of { value, label } objects
 * @param {string}   [props.className] - Extra class added to the outer wrapper div
 */
const SelectDropdown = ({ value, onChange, options = [], className = "" }) => {
  const [open,  setOpen]  = useState(false);
  const [style, setStyle] = useState({});
  const triggerRef        = useRef(null);
  const panelRef          = useRef(null);

  const selected = options.find(o => String(o.value) === String(value)) ?? options[0];

  const toggle = () => {
    if (!open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      const w = r.width;
      const l = Math.max(8, Math.min(r.left, window.innerWidth - w - 8));
      const spaceBelow = window.innerHeight - r.bottom - 8;
      const spaceAbove = r.top - 8;
      const maxH = 240;
      if (spaceBelow < 120 && spaceAbove > spaceBelow) {
        setStyle({
          position: "fixed",
          bottom: window.innerHeight - r.top + 4,
          left: l,
          width: w,
          zIndex: 9999,
          maxHeight: Math.min(maxH, spaceAbove),
        });
      } else {
        setStyle({
          position: "fixed",
          top: r.bottom + 4,
          left: l,
          width: w,
          zIndex: 9999,
          maxHeight: Math.min(maxH, spaceBelow),
        });
      }
    }
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (
        !panelRef.current?.contains(e.target) &&
        !triggerRef.current?.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close, { passive: true });
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [open]);

  return (
    <div className={`sd-wrap${className ? ` ${className}` : ""}`}>
      <button
        ref={triggerRef}
        type="button"
        className="sd-trigger"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="sd-label">{selected?.label ?? ""}</span>
        <svg
          className={`sd-chevron${open ? " sd-chevron--up" : ""}`}
          width="12" height="12" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul
          ref={panelRef}
          role="listbox"
          className="sd-panel"
          style={style}
        >
          {options.map(opt => (
            <li
              key={opt.value}
              role="option"
              aria-selected={String(opt.value) === String(value)}
              className={`sd-item${String(opt.value) === String(value) ? " sd-item--active" : ""}`}
              onMouseDown={(e) => { e.preventDefault(); onChange(opt.value); setOpen(false); }}
              onTouchEnd={(e)  => { e.preventDefault(); onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SelectDropdown;
