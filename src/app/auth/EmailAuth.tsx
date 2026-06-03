"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LogIn, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { loginWithEmail, registerWithEmail } from "@/lib/api";

type AuthMode = "login" | "register";

export default function EmailAuth() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isRegister = mode === "register";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      if (isRegister) {
        await registerWithEmail({ name, email, password });
      } else {
        await loginWithEmail({ email, password });
      }
      router.push("/dashboard");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to start session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 rounded-lg border border-border/80 bg-black/30 p-1">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setErrorMessage("");
          }}
          className={`rounded-md px-3 py-2 text-xs font-bold transition-all ${
            mode === "login"
              ? "bg-accent-blue text-white shadow-[0_0_16px_rgba(56,152,255,0.25)]"
              : "text-zinc-500 hover:text-white"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("register");
            setErrorMessage("");
          }}
          className={`rounded-md px-3 py-2 text-xs font-bold transition-all ${
            mode === "register"
              ? "bg-accent-blue text-white shadow-[0_0_16px_rgba(56,152,255,0.25)]"
              : "text-zinc-500 hover:text-white"
          }`}
        >
          Create account
        </button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {isRegister && (
          <label className="block space-y-2">
            <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              <UserRound className="w-3.5 h-3.5" />
              Name
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border border-border/80 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition-all placeholder:text-zinc-700 focus:border-accent-blue/60 focus:ring-1 focus:ring-accent-blue/30"
              placeholder="Investigator name"
              autoComplete="name"
              required
            />
          </label>
        )}

        <label className="block space-y-2">
          <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            <Mail className="w-3.5 h-3.5" />
            Email
          </span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-border/80 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition-all placeholder:text-zinc-700 focus:border-accent-blue/60 focus:ring-1 focus:ring-accent-blue/30"
            placeholder="investigator@example.com"
            type="email"
            autoComplete="email"
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            <KeyRound className="w-3.5 h-3.5" />
            Password
          </span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-border/80 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition-all placeholder:text-zinc-700 focus:border-accent-blue/60 focus:ring-1 focus:ring-accent-blue/30"
            placeholder={isRegister ? "At least 8 characters" : "Password"}
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            minLength={isRegister ? 8 : 1}
            required
          />
        </label>

        {errorMessage && (
          <div className="rounded-lg border border-accent-red/30 bg-accent-red/10 p-3 text-xs text-accent-red">
            {errorMessage}
          </div>
        )}

        <Button variant="glow" className="w-full gap-2" type="submit" loading={loading}>
          <LogIn className="w-4 h-4" />
          {isRegister ? "Create Account" : "Enter Workspace"}
        </Button>
      </form>
    </div>
  );
}
