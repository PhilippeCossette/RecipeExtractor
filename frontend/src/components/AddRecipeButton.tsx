import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";
import { SketchIcon, type SketchGeometry } from "sketchicon";
// Hand-drawn Hugeicons: named imports from the package root (names from sketchicon.com)
import {
  PlusSignIcon,
  Link04Icon,
  Search01Icon,
  ScanImageIcon,
  PencilEdit02Icon,
} from "@sketchicon/hugeicons";

/** How hand-drawn the icons look: 0 = clean, 1.5 = default, ~3 = very wobbly. */
const ICON_ROUGHNESS = 3;

/** The choices in the "+" menu. The FIRST one ends up closest to the button (the list is flex-col-reverse). */
const MENU_ITEMS: {
  label: string;
  icon: SketchGeometry;
  /** Not built yet: shows a "soon" tag. Set to false once the feature exists. */
  soon?: boolean;
}[] = [
  { label: "Write it myself", icon: PencilEdit02Icon, soon: true },
  { label: "Scan a photo", icon: ScanImageIcon, soon: true },
  { label: "Search recipes", icon: Search01Icon, soon: true },
  { label: "Paste a link", icon: Link04Icon },
];

const parentVariant = {
  open: {
    transition: {
      staggerChildren: 0.02,
      delayChildren: 0.1,
    },
  },
  closed: {
    transition: { staggerChildren: 0.06, staggerDirection: -1 },
  },
};

const childVariant = {
  open: { opacity: 1, y: 0, scale: 1 },
  closed: { opacity: 0, y: 12, scale: 0.8 },
};

const textVariant = {
  open: { opacity: 1 },
  closed: { opacity: 0 },
};

/**
 * Round "+" button: opens/closes the menu of ways to add a recipe. The menu items don't do anything yet.
 * The open state lives in AppNav (it also dims the bar and shows the backdrop), so it's passed in.
 */
export function AddRecipeButton({
  open,
  onOpenChange,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}) {
  return (
    <div className="relative ">
      <AnimatePresence>
        {open && (
          // bottom-full = the menu's BOTTOM is pinned just above the "+", so it grows UP.
          // w-max: only as wide as its content, so it never makes the page wider.
          <motion.div
            variants={parentVariant}
            initial="closed"
            animate="open"
            exit="closed"
            className="absolute bottom-full left-1/2 mb-4 w-max -translate-x-1/2"
          >
            <ul className="flex flex-col-reverse items-stretch gap-3">
              {MENU_ITEMS.map(({ label, icon, soon }, index) => {
                const pair = index % 2 === 0 ? "even" : "odd";
                return (
                  <motion.li
                    variants={childVariant}
                    whileHover={{ rotate: pair === "even" ? -2 : 2 }}
                    key={label}
                    className={`${pair === "even" ? "-translate-x-4" : "translate-x-4"} `}
                  >
                    {/* relative: the "soon" tag (absolute) is placed on THIS button's corner */}
                    <button
                      type="button"
                      className="relative flex w-full items-center gap-3 rounded-sm border-2 border-black bg-pink-300 px-5 py-3 font-semibold shadow-[0px_4px_0px_0px_black] transition-transform hover:scale-[1.03] active:scale-98"
                    >
                      <SketchIcon
                        icon={icon}
                        size={26}
                        roughness={ICON_ROUGHNESS}
                        aria-hidden
                      />
                      <motion.span variants={textVariant}>{label}</motion.span>

                      {soon && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="ml-auto absolute rotate-10 -top-2 -right-4 rounded-full border border-black bg-white px-2 text-[10px] uppercase"
                        >
                          soon
                        </motion.span>
                      )}
                    </button>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        aria-label="Add a recipe"
        aria-expanded={open}
        title="Add a recipe"
        onClick={() => onOpenChange(!open)}
        className={cn(
          "shadow-[0px_4px_0px_2.5px_black] grid size-20 shrink-0 place-items-center rounded-full bg-blue-700 text-white ring-2 ring-black outline-none transition-all duration-200 hover:bg-blue-500 focus-visible:scale-110 hover:scale-98 active:bg-blue-600 active:scale-90",
          className,
        )}
      >
        <motion.span
          animate={{ rotate: open ? 135 : 0 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
          }}
        >
          <SketchIcon
            icon={PlusSignIcon}
            size={28}
            roughness={ICON_ROUGHNESS}
            aria-hidden
          />
        </motion.span>
      </button>
    </div>
  );
}
