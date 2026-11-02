'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Loader2, Lock } from 'lucide-react';

export function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('yousuf');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

      if (!response.ok || !payload?.ok) {
        setError(payload?.error || 'Those details do not match.');
        setLoading(false);
        return;
      }

      const next = searchParams.get('next');
      const destination = next && next.startsWith('/admin') && !next.startsWith('/admin/login') ? next : '/admin';
      router.replace(destination);
      router.refresh();
    } catch {
      setError('The connection failed. Please try again.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="username" className="block text-[0.62rem] uppercase tracking-[0.2em] text-[#9A7C74]">
          Administrator
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="field mt-1.5"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-[0.62rem] uppercase tracking-[0.2em] text-[#9A7C74]">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="field mt-1.5"
          placeholder="••••••••"
          required
        />
      </div>

      {!configured && (
        <p className="rounded-[10px] border border-[#E4D6B8] bg-[#FBF5E7] p-3 text-[0.78rem] leading-relaxed text-[#7E6733]">
          Administrator access is not configured on this deployment yet. Set{' '}
          <code className="font-mono text-[0.72rem]">ADMIN_USERNAME</code>,{' '}
          <code className="font-mono text-[0.72rem]">ADMIN_PASSWORD</code> and{' '}
          <code className="font-mono text-[0.72rem]">ADMIN_SESSION_SECRET</code>, then restart.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-[10px] border border-[#E6C4C1] bg-[#FBEEEC] p-3 text-[0.8rem] leading-relaxed text-[#8E3F3F]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.6} />
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn btn-primary w-full">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} />
            Signing in…
          </>
        ) : (
          <>
            <Lock className="h-3.5 w-3.5" strokeWidth={1.6} />
            Sign in
          </>
        )}
      </button>
    </form>
  );
}
