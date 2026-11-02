import { getAdminActivity, getAdminSnapshot, getStoredCredential } from '@/lib/admin-data';
import { getDataMode, getEnvStatus } from '@/lib/env';
import { formatDhaka } from '@/lib/time';
import { Badge, DetailRow, Divider, EmptyState, PageHeader, Section } from '@/components/admin/ui';
import { RefreshButton } from '@/components/admin/refresh-button';
import { PasswordForm } from '@/components/admin/password-form';
import { LogoutButton } from '@/components/admin/logout-button';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Badge tone={ok ? 'green' : 'amber'}>
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-[#4F6547]' : 'bg-[#7E6733]'}`} />
      {label}
    </Badge>
  );
}

export default async function SettingsPage() {
  const session = await getAdminSession();
  const snapshot = await getAdminSnapshot({ eventsLimit: 1 });
  const env = getEnvStatus();
  const dataMode = getDataMode();
  const credential = await getStoredCredential();
  const activity = await getAdminActivity();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Private"
        title="Settings"
        subtitle="Your own account, the data you hold, and a health check of the backend — without exposing any secret values."
        actions={<RefreshButton />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Section
          title="Administrator account"
          description="Passwords are stored as bcrypt hashes. The database is authoritative after the first sign-in."
        >
          <dl>
            <DetailRow label="Signed in as">{session?.u ?? 'unknown'}</DetailRow>
            <DetailRow label="Session expires">
              {session ? formatDhaka(new Date(session.exp * 1000)) : '—'}
            </DetailRow>
            <DetailRow label="Password last changed">
              {credential ? formatDhaka(credential.updated_at) : 'Still using the initial password from the environment'}
            </DetailRow>
          </dl>
          <Divider />
          <PasswordForm />
        </Section>

        <Section title="Backend configuration" description="Read-only status. Secret values are never shown.">
          <div className="flex flex-wrap gap-2">
            <Badge tone={dataMode === 'supabase' ? 'green' : dataMode === 'local' ? 'amber' : 'red'}>
              {dataMode === 'supabase'
                ? 'Remote storage · Supabase'
                : dataMode === 'local'
                  ? 'Local preview storage'
                  : 'No storage configured'}
            </Badge>
            <StatusBadge ok={snapshot.databaseReachable} label="Storage reachable" />
            <StatusBadge ok={snapshot.databaseReachable} label="Database reachable" />
            <StatusBadge ok={env.supabaseUrl} label="Supabase URL" />
            <StatusBadge ok={env.supabaseServiceRole} label="Service role key" />
            <StatusBadge ok={env.supabasePublishableKey} label="Publishable key" />
            <StatusBadge ok={env.adminPasswordSeed} label="Initial admin password" />
            <StatusBadge ok={env.sessionSecret} label="Session secret" />
          </div>
          <dl className="mt-4">
            <DetailRow label="Storage bucket" mono>
              {env.storageBucket}
            </DetailRow>
            <DetailRow label="Timezone">Asia/Dhaka (GMT+6)</DetailRow>
            <DetailRow label="Database">
              {snapshot.databaseReachable ? 'Connected' : snapshot.error ?? 'Unavailable'}
            </DetailRow>
          </dl>
          {dataMode === 'local' && (
            <p className="mt-4 rounded-[10px] border border-[#E4D6B8] bg-[#FBF5E7] p-3 text-[0.76rem] leading-relaxed text-[#7E6733]">
              Local mode stores her response and private media in a JSON store under{' '}
              <code className="font-mono text-[0.72rem]">.data/</code> on this server. It is genuinely saved and
              readable here, but it is not remote: for a permanent deployment connect Supabase and remove{' '}
              <code className="font-mono text-[0.72rem]">DATA_MODE=local</code>.
            </p>
          )}
          <p className="mt-4 rounded-[10px] bg-[#FBF7F2] p-3 text-[0.76rem] leading-relaxed text-[#8B7570]">
            ADMIN_PASSWORD only primes the very first login; after that the hashed credential in the database is
            used. Keep ADMIN_SESSION_SECRET long and random, and never commit <code>.env.local</code>.
          </p>
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Session" description="End this session on this device.">
          <LogoutButton />
          <p className="mt-3 text-[0.78rem] leading-relaxed text-[#8B7570]">
            The session cookie is HttpOnly and signed with your server secret. Closing the browser does not end
            it — use this button when you are on a shared device.
          </p>
        </Section>

        <Section
          title="Delete her response"
          description="Removes her plan, photos, voice message and location, plus version snapshots. The timeline keeps a record of the deletion."
        >
          <ConfirmButton
            label="Delete response and media"
            title="Delete everything she submitted?"
            description="Her confirmed plan, version history, private photos, voice message and location will be permanently deleted."
            endpoint="/api/admin/response"
          />
          <p className="mt-3 text-[0.78rem] leading-relaxed text-[#8B7570]">
            This cannot be undone. If you only want to remove one file, use the Voice Message, Photo Gallery or
            Shared Location pages instead.
          </p>
        </Section>
      </div>

      <Section title="Recent admin activity" description="Sign-ins and sensitive changes made on this panel.">
        {activity.length ? (
          <ul className="divide-y divide-[#F1E9E1]">
            {activity.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="text-[0.84rem] capitalize text-[#3B2730]">
                  {entry.action.replaceAll('_', ' ')}
                  {entry.detail ? <span className="text-[#8B7570]"> · {entry.detail}</span> : null}
                </span>
                <span className="flex items-center gap-3 text-[0.7rem] text-[#8B7570]">
                  <Badge tone={entry.outcome === 'success' ? 'green' : entry.outcome === 'invalid' ? 'amber' : 'neutral'}>
                    {entry.outcome.replaceAll('_', ' ')}
                  </Badge>
                  {formatDhaka(entry.created_at)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No admin activity recorded yet" />
        )}
      </Section>
    </div>
  );
}
