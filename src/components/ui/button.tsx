import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2Icon } from "lucide-react"
import Link from "next/link"
import { isValidElement } from "react"
import { cn } from "cn"

// Pill buttons. Primary is the one mint action per view (mint fill, navy text; see src/app/theme.css).
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[background-color,color,border-color,transform] duration-150 ease-out outline-none select-none focus-visible:ring-3 focus-visible:ring-ring active:not-aria-[haspopup]:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-brand text-brand-foreground font-medium shadow-button hover:bg-brand-strong",
        dark: "bg-foreground text-background hover:bg-[color-mix(in_oklch,var(--foreground),white_14%)]",
        outline:
          "border-border bg-card hover:bg-muted aria-expanded:bg-muted dark:border-input",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)] aria-expanded:bg-secondary",
        ghost: "hover:bg-muted hover:text-foreground aria-expanded:bg-muted",
        destructive:
          "bg-danger-soft text-danger hover:bg-[color-mix(in_oklch,var(--danger-soft),var(--danger)_10%)] focus-visible:ring-destructive/30",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-6 gap-1 px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3 text-[13px] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-5 text-[16px]",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-11",
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
  loading = false,
  children,
  disabled,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    /** Spinner in place of the leading icon, disabled, and announced as busy. */
    loading?: boolean
  }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }), loading && "[&>svg:first-child:not(.spin)]:hidden")}
      // Rendered as a link (<Link> or <a>): link semantics, not button ones. Anything else that
      // renders its own <button> (e.g. a combobox trigger) keeps Base UI's default.
      nativeButton={rendersLink(props.render) ? false : undefined}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2Icon className="spin animate-spin" aria-hidden />}
      {children}
    </ButtonPrimitive>
  )
}

function rendersLink(render: unknown) {
  return isValidElement(render) && (render.type === Link || render.type === "a")
}

export { Button, buttonVariants }
