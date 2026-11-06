"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("oauthError")) {
      setError("Sign-in with that provider failed. Please try again.");
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error?.message ?? "Something went wrong");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Sign Up / Login</h1>
        <p className="text-sm text-neutral-500">
          Enter your username and password. Your account is created the first time you sign in.
        </p>
      </header>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="space-y-1">
          <label htmlFor="username" className="block text-sm font-medium">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={32}
            autoFocus
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            maxLength={128}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={busy || username.trim().length < 3 || password.length < 8}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <div className="flex flex-col gap-3">
        <a
          href="/api/auth/google"
          className="rounded-lg border border-neutral-300 px-4 py-2 text-center text-sm font-medium hover:bg-neutral-50"
        >
          Continue with Google
        </a>
        <a
          href="/api/auth/github"
          className="rounded-lg border border-neutral-300 px-4 py-2 text-center text-sm font-medium hover:bg-neutral-50"
        >
          Continue with GitHub
        </a>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <p className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        New username? Your account will be created on your first sign-in.
      </p>
    </main>
  );
}
