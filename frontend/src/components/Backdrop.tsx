import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

/**
 * Full-screen dark, blurred layer (z-40), e.g. behind the "+" menu.
 * Portaled into <body> so `fixed inset-0` works even inside a transformed parent.
 */
export function Backdrop({
  open,
  onClick,
  className = "",
}: {
  open: boolean;
  /** Called when the backdrop is tapped. */
  onClick?: () => void;
  /** Extra classes, e.g. "bg-ink/80" for darker or "backdrop-blur-none" for no blur. */
  className?: string;
}) {
  // No document during SSR, so only portal once mounted
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
