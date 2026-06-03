"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Shield, 
  LayoutDashboard, 
  Briefcase, 
  GitBranch, 
  UploadCloud, 
  CheckSquare, 
  Mail, 
  Bell, 
  Clock,
  Menu,
  X,
  LogOut
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { clearAuthSession, getCurrentUser, UserProfile } from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [clock, setClock] = React.useState("");

  React.useEffect(() => {
    let mounted = true;
    getCurrentUser()
      .then((profile) => {
        if (mounted) setUser(profile);
      })
      .catch(() => {
        if (mounted) setUser(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    const updateClock = () => {
      setClock(new Date().toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }));
    };
    updateClock();
    const interval = window.setInterval(updateClock, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const initials = user?.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "VC";

  const identityLabel = user?.email || "No email session";

  const signOut = () => {
    clearAuthSession();
    window.location.href = "/auth";
  };

  const navLinks = [
    {
      name: "Dashboard Overview",
      href: "/dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />
    },
    {
      name: "Case Vault Dossier",
      href: "/dashboard/cases",
      icon: <Briefcase className="w-4 h-4" />
    },
    {
      name: "Investigation Graph",
      href: "/dashboard/graph",
      icon: <GitBranch className="w-4 h-4" />
    },
    {
      name: "Advanced Ingestion",
      href: "/dashboard/upload",
      icon: <UploadCloud className="w-4 h-4" />
    },
    {
      name: "External Verifier",
      href: "/verify",
      icon: <CheckSquare className="w-4 h-4" />
    }
  ];

  return (
    <div className="relative min-h-screen bg-background text-foreground flex font-sans overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[450px] h-[350px] bg-accent-blue/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[350px] bg-accent-purple/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border/40 bg-black/60 backdrop-blur-md z-30 shrink-0">
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-border/40 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-7 h-7 rounded-lg bg-accent-blue/10 border border-accent-blue/40 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-accent-blue" />
            </div>
            <span className="font-bold tracking-tight text-sm text-white">
              Verdict<span className="text-accent-blue">Chain</span>
            </span>
          </Link>
          <Badge variant="verified" className="text-[9px] py-0 px-1 font-bold">LIVE</Badge>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
            return (
              <Link key={link.name} href={link.href}>
                <span className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 select-none ${
                  isActive 
                    ? "bg-secondary border border-border/80 text-white shadow-lg shadow-black/20" 
                    : "text-zinc-500 hover:text-foreground hover:bg-secondary/40 border border-transparent"
                }`}>
                  <span className={`${isActive ? "text-accent-blue" : "text-zinc-500"}`}>
                    {link.icon}
                  </span>
                  {link.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Session and network indicator */}
        <div className="p-4 border-t border-border/40 bg-black/40 space-y-3">
          <div className="flex items-center gap-2.5 bg-secondary/80 p-2.5 rounded-lg border border-border/80 text-[10px] font-mono">
            <Mail className="w-3.5 h-3.5 text-accent-blue flex-shrink-0" />
            <div className="space-y-0.5 truncate">
              <div className="text-zinc-400 font-bold">{user ? "Email session" : "Signed out"}</div>
              <div className="text-zinc-500 truncate text-[9px]">{identityLabel}</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-[9px] text-zinc-500 px-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
              Sui Devnet
            </span>
            <span>Tatum Verified</span>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Navbar */}
        <header className="h-16 border-b border-border/40 bg-background/80 backdrop-blur-md z-30 shrink-0 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-secondary/80 border border-border/80 md:hidden"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>
            
            {/* Dynamic Breadcrumbs */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
              <Link href="/dashboard" className="hover:text-foreground">Console</Link>
              <span>/</span>
              <span className="text-white capitalize">
                {pathname.split("/").pop() || "Overview"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Clock */}
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
              <Clock className="w-3.5 h-3.5" />
              <span>{clock}</span>
            </div>

            {/* Notifications */}
            <button className="p-1.5 rounded-lg bg-secondary/80 border border-border/80 text-zinc-400 hover:text-white transition-all relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent-red" />
            </button>

            {/* User Profile */}
            {user ? (
              <div className="flex items-center gap-2 border-l border-border/40 pl-4">
                <div className="w-7 h-7 rounded-full bg-accent-blue/15 border border-accent-blue/40 flex items-center justify-center font-bold text-xs text-accent-blue uppercase">
                  {initials}
                </div>
                <span className="hidden sm:inline text-xs font-semibold text-zinc-400">{user.name}</span>
                <button
                  onClick={signOut}
                  className="p-1.5 rounded-lg bg-secondary/80 border border-border/80 text-zinc-400 hover:text-white transition-all"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link href="/auth">
                <Button variant="secondary" size="sm">Sign in</Button>
              </Link>
            )}
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 flex md:hidden">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.aside 
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                className="relative w-64 bg-background border-r border-border/60 flex flex-col h-full z-10"
              >
                <div className="h-16 px-6 border-b border-border/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-accent-blue" />
                    <span className="font-bold text-white text-sm">VerdictChain</span>
                  </div>
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-md text-zinc-400 hover:text-white bg-secondary"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                <nav className="flex-grow p-4 space-y-1.5 overflow-y-auto">
                  {navLinks.map((link) => {
                    const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
                    return (
                      <Link key={link.name} href={link.href} onClick={() => setMobileMenuOpen(false)}>
                        <span className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                          isActive 
                            ? "bg-secondary text-white border border-border" 
                            : "text-zinc-500 hover:text-foreground"
                        }`}>
                          {link.icon}
                          {link.name}
                        </span>
                      </Link>
                    );
                  })}
                </nav>

                <div className="p-4 border-t border-border/40 bg-black/40">
                  <div className="flex items-center gap-2 bg-secondary p-2.5 rounded-lg border border-border text-[9px] font-mono">
                    <Mail className="w-3.5 h-3.5 text-accent-blue" />
                    <div className="truncate text-zinc-400">{identityLabel}</div>
                  </div>
                </div>
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        {/* Scrollable Viewport */}
        <div className="flex-grow overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
