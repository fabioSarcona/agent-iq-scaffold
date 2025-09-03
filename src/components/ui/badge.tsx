import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg px-3 py-1 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
  {
    variants: {
      variant: {
        default:
          "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20",
        secondary:
          "bg-secondary/10 text-secondary-foreground border border-secondary/20 hover:bg-secondary/20",
        success:
          "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
        warning:
          "bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800",
        destructive:
          "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
        outline: 
          "bg-transparent text-foreground border border-border hover:bg-muted",
        ghost:
          "bg-muted/50 text-muted-foreground hover:bg-muted",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        default: "px-3 py-1 text-xs",
        lg: "px-4 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }