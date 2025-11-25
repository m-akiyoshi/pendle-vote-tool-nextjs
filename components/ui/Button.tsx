import { ButtonHTMLAttributes, ReactNode } from "react";
import LoadingIcon from "../Loading";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  loadingText?: string;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  loadingText,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-white text-neutral-900 hover:bg-neutral-200 focus:ring-white disabled:bg-neutral-600 disabled:text-neutral-400",
    secondary:
      "bg-neutral-800 text-neutral-100 hover:bg-neutral-700 focus:ring-neutral-500 border border-neutral-700 disabled:bg-neutral-900 disabled:text-neutral-500 disabled:border-neutral-800",
    outline:
      "bg-transparent text-neutral-100 hover:bg-neutral-800 focus:ring-neutral-500 border border-neutral-600 disabled:text-neutral-500 disabled:border-neutral-800",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-5 py-3 text-base",
    lg: "px-6 py-4 text-lg",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <LoadingIcon />
          {loadingText || "Loading..."}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
