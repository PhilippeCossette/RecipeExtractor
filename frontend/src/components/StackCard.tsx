import {
  createContext,
  useContext,
  useId,
  useState,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from "motion/react";
import { SketchIcon } from "sketchicon";
import { ArrowUpRight01Icon } from "@sketchicon/hugeicons";
import { cn } from "cn";

/**
 * A stack of overlapping doodle cards. Tap a card's header and it slides open to show its content;
 * the cards below slide down to make room. Only one card is open at a time.
 *
 * Usage:
 *   <CardStack defaultOpenId={items[0].id}>
 *     {items.map((item, i) => (
 *       <StackCard key={item.id} id={item.id} title={item.name} color={STACK_COLORS[i % STACK_COLORS.length]}>
 *         …anything shown when the card is open…
 *       </StackCard>
 *     ))}
 *   </CardStack>
 */

/** The doodle pastels, in order. Cycle through them so neighbouring cards differ. */
export const STACK_COLORS = [
  "bg-doodle-pink",
  "bg-doodle-sky",
  "bg-doodle-mint",
  "bg-doodle-lemon",
  "bg-doodle-lilac",
] as const;

/* ------------------------------------------------------------------
   MOTION SETTINGS: tweak these to change the feel
   ------------------------------------------------------------------ */
const MOTION = {
  /** Time between each card sliding in when the stack first appears. */
  stagger: 0.06,
  /** Cards sliding up into place on first appearance. */
  enter: { type: "spring", visualDuration: 0.4, bounce: 0.3 } as Transition,
  /** A card opening / closing (the cards below follow it). */
  slide: { type: "spring", visualDuration: 0.35, bounce: 0.15 } as Transition,
  /** How far (px) cards start below their spot on first appearance. */
  enterOffset: 40,
};

const stackVariants: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: MOTION.stagger } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: MOTION.enterOffset },
  shown: { opacity: 1, y: 0, transition: MOTION.enter },
};

type StackState = { openId: string | null; toggle: (id: string) => void };
const StackContext = createContext<StackState | null>(null);

export function CardStack({
  children,
  defaultOpenId = null,
  className,
}: {
  children: ReactNode;
  /** The card that starts open (its `id`). Leave out to start with all cards closed. */
  defaultOpenId?: string | null;
  className?: string;
}) {
  const [openId, setOpenId] = useState(defaultOpenId);
  const toggle = (id: string) =>
    setOpenId((current) => (current === id ? null : id));

  return (
    <StackContext.Provider value={{ openId, toggle }}>
      <motion.ul
        variants={stackVariants}
        initial="hidden"
        animate="shown"
        className={cn("flex flex-col", className)}
      >
        {children}
      </motion.ul>
    </StackContext.Provider>
  );
}

export function StackCard({
  id,
  title,
  subtitle,
  leading,
  color = STACK_COLORS[1],
  children,
  className,
}: {
  /** Unique within the stack: decides which card is open. */
  id: string;
  title: ReactNode;
  /** Small line under the title (e.g. "4 recipes"). */
  subtitle?: ReactNode;
  /** Shown in the white circle on the left: an icon or an <img className="size-full object-cover" />. */
  leading?: ReactNode;
  /** Background: a doodle pastel class (see STACK_COLORS). */
  color?: string;
  /** What slides open under the header. */
  children?: ReactNode;
  className?: string;
}) {
  const stack = useContext(StackContext);
  if (!stack) throw new Error("<StackCard> must be inside a <CardStack>");
  const open = stack.openId === id;
  const contentId = useId();

  return (
    <motion.li
      variants={cardVariants}
      className={cn(
        // Each card tucks under the next one: -mt-8 pulls it up over the card above,
        // and pb-8 gives the card above room so its header isn't hidden. Later cards paint on top.
        "relative rounded-3xl border-2 border-ink text-ink shadow-doodle not-first:-mt-8 not-last:pb-8",
        color,
        className,
      )}
    >
      <button
        type="button"
        onClick={() => stack.toggle(id)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full items-center gap-3 rounded-3xl p-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        {leading ? (
          <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-ink bg-paper">
            {leading}
          </span>
        ) : null}

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

        {/* Ink circle with an arrow: points down-right when the card is open */}
        <motion.span
          aria-hidden
          animate={{ rotate: open ? 90 : 0 }}
          transition={MOTION.slide}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-paper"
        >
          <SketchIcon icon={ArrowUpRight01Icon} size={22} aria-hidden />
        </motion.span>
      </button>

      {/* Animating height from 0 to "auto" pushes the cards below down as it opens */}
      <AnimatePresence initial={false}>
        {open && children ? (
          <motion.div
            id={contentId}
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={MOTION.slide}
            className="overflow-hidden"
          >
            <div className="px-4 pt-1 pb-4">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.li>
  );
}
