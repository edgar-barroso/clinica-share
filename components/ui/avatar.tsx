import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Avatar = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-muted-foreground text-sm font-medium",
        className,
      )}
      {...props}
    />
  ),
);
Avatar.displayName = "Avatar";

export const AvatarFallback = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span ref={ref} className={cn("select-none", className)} {...props} />
  ),
);
AvatarFallback.displayName = "AvatarFallback";
