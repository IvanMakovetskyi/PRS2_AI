import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  intent?: "brand" | "neutral" | "warning" | "danger";
  emphasis?: "solid" | "outline" | "ghost";
  size?: "sm" | "md";
  icon?: ReactNode;
  busy?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    intent = "neutral",
    emphasis = "outline",
    size = "md",
    icon,
    busy = false,
    children,
    className = "",
    disabled,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={`button button--${intent} button--${emphasis} button--${size} ${className}`}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...props}
    >
      <span className="button__content">
        {busy ? <span className="spinner" aria-hidden="true" /> : icon}
        {children}
      </span>
    </button>
  );
});
