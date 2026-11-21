import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/text";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export function buttonStyles(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string
): string {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2";
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-strong text-on-strong hover:opacity-85",
    secondary: "bg-surface-soft text-foreground hover:bg-border",
    ghost: "text-muted hover:bg-surface-soft hover:text-foreground",
    outline: "border border-border bg-transparent text-foreground hover:bg-surface-soft"
  };
  const sizes: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-sm",
    icon: "h-10 w-10"
  };
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export function Button({ variant = "primary", size = "md", className, children, ...props }: ButtonProps) {
  return (
    <button className={buttonStyles(variant, size, className)} {...props}>
      {children}
    </button>
  );
}
