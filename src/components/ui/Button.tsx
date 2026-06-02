"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "size"> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "glow";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles = "relative inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-accent-blue/50 disabled:opacity-50 disabled:cursor-not-allowed select-none overflow-hidden";
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2.5",
  };

  const variantStyles = {
    primary: "bg-accent-blue text-white hover:bg-accent-blue/90 border border-accent-blue/20 shadow-[0_2px_10px_rgba(56,152,255,0.2)]",
    secondary: "bg-secondary text-foreground hover:bg-secondary/80 border border-border hover:border-muted-foreground/30",
    danger: "bg-accent-red text-white hover:bg-accent-red/90 border border-accent-red/20 shadow-[0_2px_10px_rgba(239,68,68,0.2)]",
    ghost: "bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40",
    glow: "bg-black text-accent-blue border border-accent-blue/40 hover:border-accent-blue hover:text-white shadow-[0_0_15px_rgba(56,152,255,0.15)]",
  };

  return (
    <motion.button
      whileTap={disabled || loading ? {} : { scale: 0.97 }}
      whileHover={disabled || loading ? {} : { scale: 1.02 }}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </motion.button>
  );
};
