import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "verified" | "tampered" | "pending" | "critical" | "high" | "medium" | "low" | "active" | "closed" | "secondary" | "glow-blue";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "secondary",
  className = "",
  ...props
}) => {
  const baseStyles = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold select-none border transition-all duration-200";

  const variantStyles = {
    verified: "bg-accent-green/10 text-accent-green border-accent-green/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
    tampered: "bg-accent-red/10 text-accent-red border-accent-red/30 shadow-[0_0_10px_rgba(239,68,68,0.1)] animate-pulse",
    pending: "bg-accent-yellow/10 text-accent-yellow border-accent-yellow/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]",
    critical: "bg-accent-red/20 text-accent-red border-accent-red/40 uppercase tracking-wider text-[10px]",
    high: "bg-orange-500/10 text-orange-500 border-orange-500/30",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
    low: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    active: "bg-accent-blue/10 text-accent-blue border-accent-blue/30 shadow-[0_0_10px_rgba(56,152,255,0.1)]",
    closed: "bg-zinc-800 text-zinc-400 border-zinc-700",
    secondary: "bg-secondary text-muted-foreground border-border",
    "glow-blue": "bg-accent-blue/20 text-white border-accent-blue/40 shadow-[0_0_10px_rgba(56,152,255,0.3)]",
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`} {...props}>
      {/* Dynamic Status Dot */}
      {(variant === "verified" || variant === "active") && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {variant === "tampered" && (
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
      )}
      {children}
    </span>
  );
};
