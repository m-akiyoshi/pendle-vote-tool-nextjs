import { ReactNode } from "react";

interface AlertProps {
  children: ReactNode;
  variant?: "error" | "success" | "warning" | "info";
  className?: string;
}

const icons = {
  error: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  success: (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

const variants = {
  error: "bg-red-950/50 border-red-900 text-red-300",
  success: "bg-green-950/50 border-green-900 text-green-300",
  warning: "bg-yellow-950/50 border-yellow-900 text-yellow-300",
  info: "bg-blue-950/50 border-blue-900 text-blue-300",
};

export function Alert({ children, variant = "info", className = "" }: AlertProps) {
  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border ${variants[variant]} ${className}`}
    >
      <span className="flex-shrink-0 mt-0.5">{icons[variant]}</span>
      <div className="text-sm">{children}</div>
    </div>
  );
}
