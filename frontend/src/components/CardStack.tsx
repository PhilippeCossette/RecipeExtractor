import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, type Transition } from "motion/react";
import { SketchIcon } from "sketchicon";
import { ArrowLeft01Icon, ArrowUpRight01Icon } from "@sketchicon/hugeicons";
import { cn } from "cn";

/** The doodle pastels, in order. Cycle through them so neighbouring cards differ. */
export const STACK_COLORS = [
  "bg-doodle-pink",
  "bg-doodle-sky",
  "bg-doodle-mint",
  "bg-doodle-lemon",
  "bg-doodle-lilac",
] as const;

/** A card growing to full page / shrinking back. */
const GROW: Transition = { type: "spring", visualDuration: 0.45, bounce: 0.1 };
/** Corner radius (px) of a card in the stack. */
const RADIUS = 28;

export function CardStack({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <ul className={cn("flex flex-col", className)}>{children}</ul>;
}

/** The round icon on the left and the static arrow on the right, shared by both card states. */
function Leading({ children }: { children: ReactNode }) {
  return (
    <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-ink bg-paper">
      {children}
    </span>
  );
}

export function StackCard({
  layoutId,
  open,
  onOpen,
  title,
  subtitle,
  leading,
  color = STACK_COLORS[1],
  className,
}: {
  /** Shared with this card's ExpandedCard, so one grows into the other. */
  layoutId: string;
  /** True while this card is shown full page (it leaves an empty spot in the stack). */
  open: boolean;
  onOpen: () => void;
  title: ReactNode;
  /** Small line under the title (e.g. "4 recipes"). */
  subtitle?: ReactNode;
  /** Shown in the white circle on the left: an icon or an <img className="size-full object-cover" />. */
  leading?: ReactNode;
  /** Background: a doodle pastel class (see STACK_COLORS). */
  color?: string;
  className?: string;
}) {
  return (
    // Each card is 88px tall but the next one starts 16px early (-mt-4), so it covers the
    // empty bottom strip and only the top row (72px) of every card shows. Later cards paint on top.
    <li className="h-22 not-first:-mt-4">
      {open ? null : (
        <motion.button
          type="button"
          layoutId={layoutId}
          onClick={onOpen}
          transition={GROW}
          whileHover={{ y: -4 }}
          style={{ borderRadius: RADIUS }}
          className={cn(
            "relative flex size-full items-start gap-3 border-2 border-ink p-3 text-left text-ink shadow-doodle outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
            color,
            className,
          )}
        >
          {/* layout="position": while growing/shrinking, the row moves without being stretched */}
          <motion.span
            layout="position"
            className="flex w-full items-center gap-3"
          >
            {leading ? <Leading>{leading}</Leading> : null}
            <span className="min-w-0 flex-1">
              <span className="block truncate font-heading text-lg leading-tight font-semibold">
                {title}
              </span>
              {subtitle ? (
                <span className="block truncate text-xs font-semibold text-ink/70">
                  {subtitle}
                </span>
              ) : null}
            </span>
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-paper">
              <SketchIcon icon={ArrowUpRight01Icon} size={22} aria-hidden />
            </span>
          </motion.span>
        </motion.button>
      )}
    </li>
  );
}

export function ExpandedCard({
  layoutId,
  onBack,
  title,
  subtitle,
  leading,
  color = STACK_COLORS[1],
  children,
}: {
  /** Same as the StackCard it grows out of. */
  layoutId: string;
  /** The back button (and the Escape key). */
  onBack: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  color?: string;
  /** The full content, under the title. */
  children?: ReactNode;
}) {
  // Escape goes back, and the page behind doesn't scroll while this is open
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // A popup open on top (e.g. "Add to list"): Escape closes that popup only
      if (document.querySelector('[role="dialog"][data-state="open"]')) return;
      onBack();
    };
    document.addEventListener("keydown", onKeyDown);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [onBack]);

  // Portal into <body>: full page even inside a transformed parent, and above the nav (z-50)
  return createPortal(
    <motion.section
      layoutId={layoutId}
      transition={GROW}
      role="dialog"
      aria-modal="true"
      style={{ borderRadius: 0 }}
      className={cn("fixed inset-0 z-40 overflow-y-auto text-ink", color)}
    >
      {/* pb-32: the nav bar sits on top of this page, so leave room for it under the last item */}
      <div className="container-page flex flex-col gap-5 pt-4 pb-32">
        <motion.span layout="position" className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-ink bg-paper shadow-doodle-sm transition-transform outline-none hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/40 active:translate-y-0.5 active:shadow-none"
          >
            <SketchIcon icon={ArrowLeft01Icon} size={22} aria-hidden />
          </button>
          {leading ? <Leading>{leading}</Leading> : null}
          <span className="min-w-0 flex-1">
            <h1 className="truncate text-2xl">{title}</h1>
            {subtitle ? (
              <span className="block truncate text-sm font-semibold text-ink/70">
                {subtitle}
              </span>
            ) : null}
          </span>
        </motion.span>

        {/* Fades in once the card has grown, so the content isn't squashed during the animation */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { delay: 0.2, duration: 0.25 },
          }}
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
        >
          {children}
        </motion.div>
      </div>
    </motion.section>,
    document.body,
  );
}
