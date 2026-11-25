import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-3 focus-visible:ring-ring/30 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        /** Solid orange: "New", counts. */
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/90",
        /** Orange tint: categories, tags ("Dessert", "TikTok"). */
        soft: "bg-accent text-accent-foreground [a]:hover:bg-primary/15",
        /** Neutral tint: metadata ("20 min", "4 servings"). */
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)]",
        success:
          "bg-success/12 text-[color-mix(in_oklch,var(--success),var(--foreground)_25%)] dark:bg-success/20 dark:text-success",
        warning:
          "bg-warning/25 text-warning-foreground dark:bg-warning/20 dark:text-warning",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 [a]:hover:bg-destructive/15",
        outline:
          "border-border bg-card text-foreground [a]:hover:bg-muted",
        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
        link: "px-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-5 px-2 text-[0.6875rem]",
        default: "",
        lg: "h-7 px-3 text-[0.8125rem]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
