import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "interactive" | "glow-blue" | "glow-purple" | "gradient";
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = "default",
  className = "",
  ...props
}) => {
  const baseStyles = "rounded-xl border transition-all duration-300 overflow-hidden";
  
  const variantStyles = {
    default: "bg-[#09090b]/80 border-border/80 text-foreground",
    glass: "glass-panel text-foreground",
    interactive: "glass-panel-interactive text-foreground cursor-pointer shadow-lg",
    "glow-blue": "bg-[#09090b]/90 border-accent-blue/30 text-foreground border-glow-blue",
    "glow-purple": "bg-[#09090b]/90 border-accent-purple/30 text-foreground border-glow-purple",
    gradient: "bg-gradient-card border-border/60 text-foreground",
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};
