import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

/** Doodle look: ink outline + hard shadow that squashes down when pressed. */
const doodle =
  "border-ink shadow-doodle active:not-aria-[haspopup]:translate-y-0.5 active:not-aria-[haspopup]:shadow-doodle-sm"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border-2 border-transparent bg-clip-padding text-sm font-bold whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform] duration-150 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:ring-offset-0 active:not-aria-[haspopup]:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /** Main call to action: solid doodle blue. One per screen ideally. */
        default: [
          doodle,
          "bg-primary text-primary-foreground hover:bg-doodle-action-hover aria-expanded:bg-doodle-action-hover",
        ],
        /** Pastel sky: secondary actions that still belong to the brand ("Save", "Add to list"). */
        soft: [
          doodle,
          "bg-accent text-accent-foreground hover:bg-[color-mix(in_oklch,var(--accent),var(--foreground)_8%)] aria-expanded:bg-[color-mix(in_oklch,var(--accent),var(--foreground)_8%)]",
        ],
        /** Cream filled. */
        secondary: [
          doodle,
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)] aria-expanded:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)]",
        ],
        /** White with an ink outline: "Cancel", filters, toolbars. */
        outline: [
          doodle,
          "bg-card text-foreground hover:bg-muted aria-expanded:bg-muted dark:bg-input/20 dark:hover:bg-input/40",
        ],
        /** No background until hover: nav links, icon buttons. */
        ghost:
          "text-foreground hover:bg-muted aria-expanded:bg-muted dark:hover:bg-muted/60",
        /** Soft red: delete in a list or menu. */
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/15 focus-visible:ring-destructive/25 dark:bg-destructive/20 dark:hover:bg-destructive/30",
        /** Solid red: the final "Delete" in a confirm dialog. */
        "destructive-solid": [
          doodle,
          "bg-destructive text-paper hover:bg-destructive/90 focus-visible:ring-destructive/30",
        ],
        link: "h-auto px-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-7 gap-1 rounded-md px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-8 gap-1.5 rounded-md px-3 text-[0.8125rem] [&_svg:not([class*='size-'])]:size-3.5",
        default: "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        lg: "h-11 gap-2 rounded-xl px-5 text-[0.9375rem] has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        xl: "h-13 gap-2.5 rounded-xl px-6 text-base [&_svg:not([class*='size-'])]:size-5",
        icon: "size-10",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-11 rounded-xl",
      },
      /** Fully rounded ends, for chips and floating actions. */
      pill: {
        true: "rounded-full",
      },
      /** Stretch to the container width (mobile forms, dialogs). */
      block: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  pill,
  block,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, pill, block, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
