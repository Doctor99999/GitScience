"use client";

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

const VARIANT: Record<ButtonVariant, string> = {
  primary: "sci-btn-primary text-white",
  secondary: "sci-btn-secondary",
  ghost: "text-[var(--text-mid)] bg-transparent border border-transparent hover:text-[var(--sci-red)] hover:bg-[var(--sci-red-dim)]",
  danger:
    "text-[var(--err)] bg-[var(--err-dim)] border border-[var(--err)]/40 hover:bg-[var(--err)]/20",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-[10px]",
  md: "px-5 py-2.5 text-[11px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "secondary",
      size = "md",
      loading = false,
      icon,
      disabled,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`sci-focus inline-flex items-center justify-center gap-2 font-mono font-bold uppercase tracking-[0.1em] transition-all duration-150 select-none whitespace-nowrap disabled:opacity-40 disabled:pointer-events-none ${VARIANT[variant]} ${SIZE[size]} ${className ?? ""}`}
        {...rest}
      >
        {loading ? (
          <span
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden
          />
        ) : icon ? (
          <span className="inline-flex items-center" aria-hidden>
            {icon}
          </span>
        ) : null}
        {children}
      </button>
    );
  },
);
