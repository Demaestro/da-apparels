import { forwardRef } from "react";
import { clsx } from "clsx";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="font-sans text-xs tracking-widest uppercase text-obsidian-400">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={clsx(
          "w-full border bg-transparent px-4 py-3",
          "font-sans text-sm text-obsidian placeholder:text-obsidian-300",
          "focus:outline-none transition-colors duration-200",
          error
            ? "border-error focus:border-error"
            : "border-obsidian-200 focus:border-obsidian",
          className,
        )}
        {...props}
      />
      {error && <p className="font-sans text-xs text-error">{error}</p>}
    </div>
  ),
);

Input.displayName = "Input";
