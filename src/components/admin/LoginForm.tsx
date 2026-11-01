'use client';

/**
 * Password → /api/admin/login. The password never leaves the browser in any
 * form other than the POST body, no hash or secret is exposed, and every
 * failure reads the same so nothing about the configuration can be inferred.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';

interface LoginFormProps {
  slug: string;
}

export function LoginForm({ slug }: LoginFormProps): JSX.Element {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setPassword('');
        router.replace(`/vault-${slug}`);
        router.refresh();
        return;
      }

      if (response.status === 429) {
        setError('Too many attempts. Wait fifteen minutes, then try again.');
      } else {
        setError('That password is not right.');
      }
    } catch {
      setError('Could not reach the vault. Check your connection and try again.');
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="glass p-6">
      <label htmlFor="admin-password" className="field-label">
        Password
      </label>
      <div className="relative">
        <input
          id="admin-password"
          type={visible ? 'text' : 'password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          autoFocus
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'login-error' : undefined}
          className="text-input pr-12"
          placeholder="••••••••••"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-white/40 transition hover:text-white"
        >
          {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      </div>

      {error && (
        <p id="login-error" role="alert" className="mt-3 text-sm text-rose-soft">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || password.length === 0}
        className="btn-primary mt-5 w-full justify-center py-3 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? (
          <>
            <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Checking…
          </>
        ) : (
          <>
            <Lock size={15} aria-hidden="true" /> Unlock
          </>
        )}
      </button>

      <p className="mt-4 text-center text-[0.64rem] leading-relaxed text-white/25">
        Five attempts are allowed every fifteen minutes.
      </p>
    </form>
  );
}
