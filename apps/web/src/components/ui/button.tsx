import { forwardRef } from "react";
import { clsx } from "clsx";

type Variant = "primary" | "ghost" | "gold" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-obsidian text-ivory-warm border border-obsidian hover:bg-gold hover:border-gold hover:text-obsidian",
  ghost: "bg-transparent text-obsidian border border-obsidian hover:bg-obsidian hover:text-ivory-warm",
  gold: "bg-gold text-obsidian border border-gold hover:bg-gold-light",
  danger: "bg-error text-white border border-error hover:bg-red-700",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-8 py-4 text-xs",
  lg: "px-12 py-5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading = false, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center gap-2",
        "font-sans tracking-widest uppercase",
        "transition-all duration-300",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Please wait…</span>
        </>
      ) : children}
    </button>
  ),
);

Button.displayName = "Button";
