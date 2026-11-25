import { Fragment, useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { SketchIcon, type SketchGeometry } from "sketchicon";
import {
  Home01Icon,
  ChefHatIcon,
  LeftToRightListBulletIcon,
  UserIcon,
} from "@sketchicon/hugeicons";
import { AnimatePresence, motion, type Transition } from "motion/react";
import { AddRecipeButton } from "@/components/AddRecipeButton";
import { Backdrop } from "@/components/Backdrop";

type NavLink = {
  to: "/home" | "/recipes" | "/lists" | "/profile";
  label: string;
  icon: SketchGeometry;
  /** Nametag colour: a doodle pastel class from styles.css. */
  color: string;
};

const LINKS: NavLink[] = [
  { to: "/home", label: "Home", icon: Home01Icon, color: "bg-doodle-pink" },
  {
    to: "/recipes",
    label: "Recipes",
    icon: ChefHatIcon,
    color: "bg-doodle-sky",
  },
  {
    to: "/lists",
    label: "Lists",
    icon: LeftToRightListBulletIcon,
    color: "bg-doodle-mint",
  },
  {
    to: "/profile",
    label: "Profile",
    icon: UserIcon,
    color: "bg-doodle-lilac",
  },
];

/** How hand-drawn the nav icons look: 0 = clean, 1.5 = default, ~3 = very wobbly. */
const ICON_ROUGHNESS = 3;

/** Radius (px) of the round cut in the bar around the "+" button. 0 = no notch. */
const NOTCH_RADIUS = 0;
/** Cuts a half-circle out of the top-centre of the bar, border included. */
const NOTCH_MASK = `radial-gradient(circle at 50% 0, transparent ${NOTCH_RADIUS}px, black ${NOTCH_RADIUS + 1}px)`;

/** How the folder nametags slide up and down. */
const FOLDER = {
  /** Going down behind the bar (the tab you're leaving). */
  goDown: { duration: 0.15, ease: "easeIn" } as Transition,
  /** Popping up (the tab you're going to). The delay waits for the old one to go down first. */
  popUp: {
    type: "spring",
    visualDuration: 0.3,
    bounce: 0.35,
    delay: 0.15,
  } as Transition,
};

/**
 * Bottom nav for signed-in pages: 2 tabs, the "+" button, 2 tabs.
 * The active tab's folder nametag pops up from behind the bar.
 */
export function AppNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // "/recipes/123" keeps "Recipes" active
  const isActive = (to: string) =>
    pathname === to || pathname.startsWith(`${to}/`);
  const activeTo = LINKS.find((l) => isActive(l.to))?.to;
  const middle = Math.floor(LINKS.length / 2);
  /** "+" menu open: shows the backdrop and dims the bar. */
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the menu when the page changes, or when Escape is pressed
  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <nav
      // z-50: above the Backdrop (z-40)
      className="fixed bottom-0 z-50 w-full flex-col justify-center"
      aria-label="Main"
    >
      <div className="relative">
        <span className="absolute w-full bottom-full left-0 h-3 bg-ink blur-[90px] block" />
        <div className="relative z-10 py-3 w-full flex ">
          {/* Bar background on its own layer, so the notch mask doesn't clip the nametags */}
          <div
            aria-hidden
            className="absolute inset-0 border-t-2 border-ink bg-doodle-sun"
            style={{ maskImage: NOTCH_MASK, WebkitMaskImage: NOTCH_MASK }}
          />

          {/* Dims the bar while the "+" menu is open; tap to close */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                aria-hidden
                onClick={() => setMenuOpen(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 z-10 bg-ink/40"
              />
            )}
          </AnimatePresence>

          {/* Black curve under the "+": a ring with only its left + bottom border, rotated -45deg */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full border-2 border-transparent border-b-ink border-l-ink"
            style={{ width: NOTCH_RADIUS * 2, height: NOTCH_RADIUS * 2 }}
          />

          {/* "+" button, centred on the bar's top edge */}
          <div className="absolute top-0 left-1/2 z-40 -translate-x-1/2 -translate-y-1/2">
            <AddRecipeButton open={menuOpen} onOpenChange={setMenuOpen} />
          </div>

          <ul className="relative flex w-full justify-around">
            {LINKS.map(({ to, label, icon, color }, i) => {
              const active = to === activeTo;
              return (
                <Fragment key={to}>
                  {/* Gap in the middle for the "+" */}
                  {i === middle && (
                    <li aria-hidden style={{ width: NOTCH_RADIUS * 2 }} />
                  )}

                  <li
                    className={` ${active ? ` max-w-40 ring-2 ring-ink rounded-md ${color}` : ""} relative px-2 py-2 `}
                  >
                    {/* Clips the nametag so it slides behind the bar; dimmed with the bar while the menu is open */}
                    <div
                      aria-hidden
                      className={`pointer-events-none absolute bottom-full left-1/2 mb-3 -translate-x-1/2 overflow-hidden px-1 pt-2 transition-[filter] duration-200 ${menuOpen ? "brightness-60" : ""}`}
                    >
                      <motion.div
                        initial={false}
                        animate={{ y: active ? 0 : "110%" }}
                        transition={active ? FOLDER.popUp : FOLDER.goDown}
                        className={`whitespace-nowrap rounded-t-md border-2 border-b-0 border-ink px-2 pt-0.5 text-[11px] font-bold uppercase tracking-wide text-ink ${color}`}
                      >
                        {label}
                      </motion.div>
                    </div>

                    <Link
                      to={to}
                      aria-label={label}
                      title={label}
                      aria-current={active ? "page" : undefined}
                      className="flex"
                    >
                      <SketchIcon
                        icon={icon}
                        size={32}
                        roughness={ICON_ROUGHNESS}
                        aria-hidden
                      />
                    </Link>
                  </li>
                </Fragment>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Dark, blurred page behind the menu; tap to close */}
      <Backdrop open={menuOpen} onClick={() => setMenuOpen(false)} />
    </nav>
  );
}
