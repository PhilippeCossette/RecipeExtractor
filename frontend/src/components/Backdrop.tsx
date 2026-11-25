import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

/**
 * Full-screen dark + blurred layer, e.g. behind the "+" menu.
 * Rendered straight into <body> with a portal, so `fixed inset-0` covers the whole screen
 * even when the component using it sits inside a transformed parent (like the "+" button in AppNav).
 *
 * Usage (in AddRecipeButton):
 *   <Backdrop open={open} onClick={() => setOpen(false)} />
 * and add `z-50` to the <nav> in AppNav so the bar stays above it (the backdrop is z-40).
 */
export function Backdrop({
  open,
  onClick,
  className = "",
}: {
  open: boolean;
  /** Called when the backdrop is tapped (e.g. to close the menu). */
  onClick?: () => void;
  /** Extra classes, e.g. "bg-ink/80" for darker or "backdrop-blur-none" for no blur. */
  className?: string;
}) {
  // document doesn't exist during server rendering (TanStack Start), so only portal once mounted
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          aria-hidden
          onClick={onClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`fixed inset-0 z-40 bg-ink/60 backdrop-blur-xs ${className}`}
        />
      )}
    </AnimatePresence>,
    document.body,
  );
}
