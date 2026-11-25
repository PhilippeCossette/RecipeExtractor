import * as React from "react"
import { cn } from "cn"

/**
 * Card variants:
 * - variant="default"  white surface, ink outline, hard doodle shadow
 * - variant="flat"     no outline or shadow, cream background (grouping inside a page)
 * - variant="interactive" lifts on hover (the shadow grows) — wrap a whole card in a <Link>
 * Sizes change the inner padding: sm = 16px, default = 20px (24px on ≥640px), lg = 32px.
 */
function Card({
  className,
  size = "default",
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "sm" | "lg"
  variant?: "default" | "flat" | "interactive"
}) {
  return (
    <div
      data-slot="card"
      data-size={size}
      data-variant={variant}
      className={cn(
        "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-2xl border-2 border-ink bg-card py-(--card-spacing) text-sm text-card-foreground",
        "[--card-spacing:--spacing(5)] sm:[--card-spacing:--spacing(6)] data-[size=sm]:[--card-spacing:--spacing(4)] data-[size=lg]:[--card-spacing:--spacing(8)]",
        "data-[variant=default]:shadow-doodle",
        "data-[variant=flat]:border-transparent data-[variant=flat]:bg-muted",
        "data-[variant=interactive]:shadow-doodle data-[variant=interactive]:transition-[box-shadow,transform] data-[variant=interactive]:duration-150 data-[variant=interactive]:hover:-translate-y-0.5 data-[variant=interactive]:hover:shadow-doodle-lg data-[variant=interactive]:active:translate-y-0.5 data-[variant=interactive]:active:shadow-doodle-sm",
        "has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 *:[img:first-child]:rounded-t-2xl *:[img:last-child]:rounded-b-2xl",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1.5 rounded-t-2xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-lg leading-snug font-semibold tracking-tight group-data-[size=sm]/card:text-base group-data-[size=lg]/card:text-xl",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm leading-relaxed text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing)", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center gap-2 rounded-b-2xl border-t-2 border-ink bg-muted px-(--card-spacing) py-4",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
