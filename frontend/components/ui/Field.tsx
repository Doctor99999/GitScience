"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from "react";

/* ─── shared base classes ─── */
const base =
  "sci-focus w-full border border-[var(--surface-border)] bg-black/40 px-3 py-2.5 text-[13px] text-[var(--foreground)] placeholder:text-[var(--text-faint)] transition-colors hover:border-[var(--surface-border-strong)] focus:border-[var(--sci-red)]";

function Label({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`sci-label mb-1.5 block text-[var(--text-mid)] ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

/* ─── Input ─── */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  icon?: string;
  hint?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, icon, hint, className, id, ...props }, ref) {
    return (
      <label className="block" htmlFor={id}>
        {label && <Label>{label}</Label>}
        <div className="relative">
          {icon && (
            <span
              className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-[var(--text-faint)]"
              aria-hidden
            >
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={`${base} ${icon ? "pl-9" : ""} ${className ?? ""}`}
            style={{ borderRadius: "var(--radius-card)" }}
            {...props}
          />
        </div>
        {hint && (
          <span className="mt-1 block text-[11px] text-[var(--text-low)]">
            {hint}
          </span>
        )}
      </label>
    );
  },
);

/* ─── Select ─── */
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  hint?: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ label, hint, className, id, children, ...props }, ref) {
    return (
      <label className="block" htmlFor={id}>
        {label && <Label>{label}</Label>}
        <select
          ref={ref}
          id={id}
          className={`${base} ${className ?? ""}`}
          style={{ borderRadius: "var(--radius-card)" }}
          {...props}
        >
          {children}
        </select>
        {hint && (
          <span className="mt-1 block text-[11px] text-[var(--text-low)]">
            {hint}
          </span>
        )}
      </label>
    );
  },
);

/* ─── Textarea ─── */
interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, hint, className, id, ...props }, ref) {
    return (
      <label className="block" htmlFor={id}>
        {label && <Label>{label}</Label>}
        <textarea
          ref={ref}
          id={id}
          className={`${base} min-h-[120px] resize-y ${className ?? ""}`}
          style={{ borderRadius: "var(--radius-card)" }}
          {...props}
        />
        {hint && (
          <span className="mt-1 block text-[11px] text-[var(--text-low)]">
            {hint}
          </span>
        )}
      </label>
    );
  },
);

/* ─── Checkbox ─── */
interface CheckboxProps {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({
  label,
  checked,
  onChange,
  id,
  disabled,
  className,
}: CheckboxProps) {
  return (
    <label
      className={`inline-flex cursor-pointer items-start gap-2.5 text-[13px] text-[var(--foreground)] ${disabled ? "cursor-not-allowed opacity-40" : ""} ${className ?? ""}`}
      htmlFor={id}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sci-focus mt-0.5 h-4 w-4 shrink-0 accent-[var(--sci-red)]"
      />
      <span className="leading-snug">{label}</span>
    </label>
  );
}
