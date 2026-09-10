"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiFetch("/api/v1/signup", {
        method: "POST",
        body: JSON.stringify({ username, email, password }),
      });
      localStorage.setItem("token", data.token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md radius-card border border-[var(--border-color)] bg-[var(--bg-color)] p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-[var(--text-color)]">Join NOVA</h1>
        <p className="mb-8 text-sm text-[var(--muted-color)]">Create an account to start thinking visually.</p>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-color)]" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full radius-container border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-sm outline-none transition-colors focus:border-[var(--color-nova-ink)] focus:bg-[var(--bg-color)]"
              placeholder="Your username"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-color)]" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full radius-container border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-sm outline-none transition-colors focus:border-[var(--color-nova-ink)] focus:bg-[var(--bg-color)]"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-color)]" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full radius-container border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-sm outline-none transition-colors focus:border-[var(--color-nova-ink)] focus:bg-[var(--bg-color)]"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="radius-pill mt-4 w-full bg-[var(--color-nova-ink)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted-color)]">
          Already have an account?{" "}
          <a href="/signin" className="text-[var(--color-nova-ink)] hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
