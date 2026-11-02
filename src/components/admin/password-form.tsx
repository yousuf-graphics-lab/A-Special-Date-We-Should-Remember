'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [state, setState] = useState<'idle' | 'saving' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Use at least 8 characters for the new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match.');
      return;
    }

    setState('saving');
    try {
      const response = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const body = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !body?.ok) {
        setError(body?.error || 'The password could not be changed.');
        setState('idle');
        return;
      }
      setState('done');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError('The connection failed. Please try again.');
      setState('idle');
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3.5" autoComplete="off">
      <div>
        <label htmlFor="current-password" className="block text-[0.62rem] uppercase tracking-[0.2em] text-[#9A7C74]">
          Current password
        </label>
        <input
          id="current-password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          className="field mt-1.5"
          required
        />
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <div>
          <label htmlFor="new-password" className="block text-[0.62rem] uppercase tracking-[0.2em] text-[#9A7C74]">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="field mt-1.5"
            minLength={8}
            required
          />
        </div>
        <div>
          <label htmlFor="confirm-password" className="block text-[0.62rem] uppercase tracking-[0.2em] text-[#9A7C74]">
            Repeat new password
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="field mt-1.5"
            minLength={8}
            required
          />
        </div>
      </div>

      {error && (
        <p className="flex items-start gap-2 rounded-[10px] border border-[#E6C4C1] bg-[#FBEEEC] p-3 text-[0.8rem] leading-relaxed text-[#8E3F3F]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.6} />
          {error}
        </p>
      )}

      {state === 'done' && (
        <p className="flex items-start gap-2 rounded-[10px] border border-[#C9D8C1] bg-[#F1F6EE] p-3 text-[0.8rem] leading-relaxed text-[#4F6547]">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.6} />
          Your administrator password has been updated. Use it the next time you sign in.
        </p>
      )}

      <button
        type="submit"
        disabled={state === 'saving'}
        className="inline-flex items-center gap-2 rounded-full bg-[#3B2730] px-4 py-2.5 text-[0.68rem] uppercase tracking-[0.16em] text-[#FBF3EC] transition hover:bg-[#2E1D25] disabled:opacity-60"
      >
        {state === 'saving' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {state === 'saving' ? 'Updating…' : 'Update password'}
      </button>
    </form>
  );
}
