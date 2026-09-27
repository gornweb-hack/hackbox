import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Кнопки «Liquid Glass»: все — пилюли, зона нажатия от 44 px. Синяя (default) — одна на экран, главное действие;
// outline — стеклянная, secondary — мягкая синяя, dark — вторичная на тёмном стекле
const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center rounded-full bg-clip-padding font-medium whitespace-nowrap transition-[filter,transform,background-color,border-color,box-shadow] duration-150 ease-(--ease-spring) outline-none select-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:not-aria-[haspopup]:scale-[.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-primary font-semibold text-primary-foreground shadow-(--primary-shadow) hover:brightness-107 active:brightness-92",
        outline: "glass glass-press text-primary-text hover:text-primary-text",
        secondary:
          "border border-primary-soft-border bg-primary-soft font-semibold text-primary-text hover:border-primary hover:text-primary-text",
        dark: "glass-on-dark text-on-dark hover:bg-white/14",
        ghost: "border border-transparent hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "border border-destructive/25 bg-destructive/10 font-semibold text-destructive hover:bg-destructive/15 focus-visible:ring-destructive/40",
        link: "border border-transparent text-primary-text underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 gap-2 px-5 text-[15px]",
        xs: "h-7 gap-1 px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-3.5 text-sm [&_svg:not([class*='size-'])]:size-4",
        lg: "h-[50px] gap-2 px-6 text-[15px]",
        xl: "h-[54px] gap-2.5 px-7 text-base",
        icon: "size-11 [&_svg:not([class*='size-'])]:size-5",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-9 [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-12 [&_svg:not([class*='size-'])]:size-5",
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
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
