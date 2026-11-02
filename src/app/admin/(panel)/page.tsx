import Link from 'next/link';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Compass,
  Images,
  MapPin,
  Mic,
  ShieldAlert,
} from 'lucide-react';
import { getAdminSnapshot } from '@/lib/admin-data';
import { getDataMode } from '@/lib/env';
import { ACTIVITY_LABELS, type ActivityId } from '@/lib/content';
import { formatCalendarDate, formatDhaka, formatTimeLabel } from '@/lib/time';
import { describeEvent, EVENT_LABELS } from '@/lib/admin-labels';
import { Badge, EmptyState, PageHeader, Section, StatCard } from '@/components/admin/ui';
import { RefreshButton } from '@/components/admin/refresh-button';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const snapshot = await getAdminSnapshot({ eventsLimit: 8 });
  const { response, media, location, proposals, events, responseCount } = snapshot;

  const voice = media.find((item) => item.media_type === 'voice') ?? null;
  const photos = media.filter((item) => item.media_type === 'photo');
  const latestProposal = proposals[0] ?? null;
  const latestYes = proposals.find((item) => item.answer === 'yes') ?? null;

  const dataMode = getDataMode();
  const latestStatus = response
    ? 'Yes — a date is planned'
    : latestProposal?.answer === 'no'
      ? 'Not today — she chose to wait'
      : latestYes
        ? 'Yes — planning in progress'
        : 'Awaiting her answer';

  const activityLabel = response
    ? ACTIVITY_LABELS[response.selected_activity as ActivityId] ?? response.selected_activity
    : '—';

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        subtitle="A quiet little window into her answer. Everything here comes straight from the database — nothing is invented."
        actions={<RefreshButton autoRefreshSeconds={45} label="Refresh now" />}
      />

      {dataMode === 'local' && (
        <div className="flex items-start gap-3 rounded-[12px] border border-[#DCC9C1] bg-[#FBF4EE] p-4 text-[0.82rem] leading-relaxed text-[#6D575B]">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.6} />
          <div>
            <p className="font-medium text-[#3B2730]">Preview storage is active (local mode).</p>
            <p className="mt-1">
              This build is running without a reachable Supabase project, so her answers are being saved to
              private files on this server (<code className="font-mono text-[0.74rem]">.data/</code>). Everything
              below is real data from that store. For permanent remote storage, connect Supabase and remove{' '}
              <code className="font-mono text-[0.74rem]">DATA_MODE=local</code>.
            </p>
          </div>
        </div>
      )}

      {!snapshot.backendConfigured && (
        <div className="flex items-start gap-3 rounded-[12px] border border-[#E4D6B8] bg-[#FBF5E7] p-4 text-[0.84rem] leading-relaxed text-[#7E6733]">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.6} />
          <div>
            <p className="font-medium">The backend is not configured on this deployment.</p>
            <p className="mt-1">
              Set <code className="font-mono text-[0.75rem]">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
              <code className="font-mono text-[0.75rem]">SUPABASE_SERVICE_ROLE_KEY</code> (see{' '}
              <code className="font-mono text-[0.75rem]">.env.example</code>). Until then her answers cannot be
              saved, and nothing below is live.
            </p>
          </div>
        </div>
      )}

      {snapshot.backendConfigured && !snapshot.databaseReachable && (
        <div className="flex items-start gap-3 rounded-[12px] border border-[#E6C4C1] bg-[#FBEEEC] p-4 text-[0.84rem] leading-relaxed text-[#8E3F3F]">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.6} />
          <div>
            <p className="font-medium">The database could not be reached.</p>
            <p className="mt-1">{snapshot.error ?? 'Check the Supabase project status and credentials.'}</p>
          </div>
        </div>
      )}

      {!response && (
        <div className="rounded-[14px] border border-[#E7DCD2] bg-gradient-to-br from-[#FCF7F1] to-[#F6EBE2] px-6 py-8 text-center">
          <p className="font-display text-[1.35rem] text-[#3B2730]">
            Her little surprise is waiting for her answer.
          </p>
          <p className="mx-auto mt-2 max-w-lg text-[0.84rem] leading-relaxed text-[#7A6565]">
            Once Samiya unlocks the website, reads her letter and confirms a plan, her real answers will appear
            here.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Badge tone={latestProposal?.answer === 'no' ? 'amber' : 'rose'}>
              {latestStatus}
            </Badge>
            {latestProposal && <Badge>last answer · {formatDhaka(latestProposal.created_at)}</Badge>}
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total date responses"
          value={responseCount}
          hint={responseCount === 1 ? 'One little plan saved' : 'No plan saved yet'}
          accent
          icon={<CheckCircle2 className="h-4 w-4" strokeWidth={1.6} />}
        />
        <StatCard
          label="Latest response status"
          value={latestStatus}
          hint={
            latestProposal
              ? `Last proposal answer · ${formatDhaka(latestProposal.created_at)}`
              : 'No answer yet'
          }
          icon={<Compass className="h-4 w-4" strokeWidth={1.6} />}
        />
        <StatCard
          label="Selected date"
          value={response ? formatCalendarDate(response.selected_date) : '—'}
          hint={response ? 'Her preferred day' : 'Waiting for her choice'}
          icon={<CalendarDays className="h-4 w-4" strokeWidth={1.6} />}
        />
        <StatCard
          label="Selected time"
          value={response ? formatTimeLabel(response.selected_time) : '—'}
          hint={response?.time_mode === 'custom' ? 'A custom time she chose' : 'Asia/Dhaka'}
          icon={<Clock className="h-4 w-4" strokeWidth={1.6} />}
        />
        <StatCard
          label="Preferred activity"
          value={activityLabel}
          hint={response?.custom_activity ?? (response ? 'No extra note' : '—')}
          icon={<Compass className="h-4 w-4" strokeWidth={1.6} />}
        />
        <StatCard
          label="Latest submission"
          value={response ? formatDhaka(response.updated_at) : '—'}
          hint={response ? `Confirmed in Asia/Dhaka · version ${response.response_version}` : 'Nothing submitted yet'}
          icon={<Clock className="h-4 w-4" strokeWidth={1.6} />}
        />
        <StatCard
          label="Voice message"
          value={voice ? 'Submitted' : 'Not shared'}
          hint={
            voice
              ? `${voice.duration_seconds ? `${Math.round(Number(voice.duration_seconds))}s` : 'Recording'} · ${formatDhaka(voice.created_at)}`
              : 'She can choose to skip this'
          }
          icon={<Mic className="h-4 w-4" strokeWidth={1.6} />}
        />
        <StatCard
          label="Photos submitted"
          value={`${photos.length} of 5`}
          hint={photos.length ? 'Private gallery available' : 'No photos have been shared'}
          icon={<Images className="h-4 w-4" strokeWidth={1.6} />}
        />
        <StatCard
          label="Location"
          value={location ? 'Shared' : 'Not shared'}
          hint={
            location
              ? location.source === 'device'
                ? 'Coordinates shared from her device'
                : 'A place she typed in'
              : 'She can skip this too'
          }
          icon={<MapPin className="h-4 w-4" strokeWidth={1.6} />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <Section title="Our plan at a glance" description="Only the details she actually submitted.">
          {response ? (
            <div className="space-y-3">
              <div className="rounded-[12px] border border-[#EADFD6] bg-[#FCF8F3] p-4">
                <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[#9A7C74]">Her plan</p>
                <p className="mt-1 font-display text-[1.18rem] text-[#3B2730]">
                  {formatCalendarDate(response.selected_date)} · {formatTimeLabel(response.selected_time)}
                </p>
                <p className="text-[0.86rem] text-[#6D575B]">
                  {activityLabel}
                  {response.custom_activity ? ` — ${response.custom_activity}` : ''}
                </p>
              </div>

              {response.personal_message ? (
                <blockquote className="rounded-[12px] border border-[#EADFD6] bg-white/70 p-4">
                  <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[#9A7C74]">Her message</p>
                  <p className="mt-1 whitespace-pre-line text-[0.9rem] leading-relaxed text-[#3B2730]">
                    {response.personal_message}
                  </p>
                </blockquote>
              ) : (
                <p className="rounded-[12px] border border-dashed border-[#DCCEC4] bg-[#FBF7F2] p-4 text-[0.82rem] text-[#8B7570]">
                  She didn&apos;t leave a message — that was optional.
                </p>
              )}

              <Link
                href="/admin/response"
                className="inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.16em] text-[#8C4655] hover:text-[#3B2730]"
              >
                Open the full date response →
              </Link>
            </div>
          ) : (
            <EmptyState title="No confirmed plan yet">
              Her date response will appear here the moment she confirms it.
            </EmptyState>
          )}
        </Section>

        <Section title="Recent activity" description="A timeline of things that really happened.">
          {events.length ? (
            <ol className="space-y-4">
              {events.map((event) => (
                <li key={event.id} className="relative border-l border-[#E3D6CB] pl-4">
                  <span className="absolute -left-[3px] top-[7px] h-[5px] w-[5px] rounded-full bg-[#B08A7C]" />
                  <p className="text-[0.85rem] leading-snug text-[#3B2730]">
                    {EVENT_LABELS[event.event_type] ?? event.event_type}
                  </p>
                  {describeEvent(event.event_type, event.detail) && (
                    <p className="text-[0.74rem] text-[#8B7570]">
                      {describeEvent(event.event_type, event.detail)}
                    </p>
                  )}
                  <p className="mt-0.5 text-[0.68rem] uppercase tracking-[0.12em] text-[#A0877C]">
                    {formatDhaka(event.created_at)}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState title="Nothing here yet">Her unfolding answers will be recorded here.</EmptyState>
          )}
        </Section>
      </div>
    </div>
  );
}
