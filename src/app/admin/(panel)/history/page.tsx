import { getAllEvents, getAdminSnapshot, getResponseVersions } from '@/lib/admin-data';
import { formatCalendarDate, formatDhaka, formatTimeLabel } from '@/lib/time';
import { describeEvent, EVENT_LABELS } from '@/lib/admin-labels';
import { Badge, EmptyState, PageHeader, Section } from '@/components/admin/ui';
import { RefreshButton } from '@/components/admin/refresh-button';

export const dynamic = 'force-dynamic';

const TONES: Record<string, 'neutral' | 'rose' | 'green' | 'amber' | 'red'> = {
  proposal_yes: 'green',
  proposal_no: 'amber',
  date_confirmed: 'rose',
  date_updated: 'rose',
  voice_submitted: 'green',
  voice_deleted: 'neutral',
  photos_submitted: 'green',
  photo_deleted: 'neutral',
  location_submitted: 'green',
  location_removed: 'neutral',
  response_deleted: 'red',
};

export default async function HistoryPage() {
  const snapshot = await getAdminSnapshot({ eventsLimit: 1 });
  const events = await getAllEvents();
  const versions = snapshot.response ? await getResponseVersions(snapshot.response.id) : [];
  const proposals = snapshot.proposals;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="The timeline"
        title="Submission History"
        subtitle="Only things that actually happened. Timestamps are shown in Asia/Dhaka (GMT+6)."
        actions={<RefreshButton />}
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Section title="Timeline" description="Newest first.">
          {events.length ? (
            <ol className="space-y-0">
              {events.map((event, index) => (
                <li key={event.id} className="relative flex gap-4 pb-5 pl-1">
                  <div className="relative flex flex-col items-center">
                    <span
                      className={`mt-1 h-2 w-2 rounded-full ${
                        event.event_type === 'response_deleted'
                          ? 'bg-[#8E3F3F]'
                          : event.event_type.includes('deleted') || event.event_type.includes('removed')
                            ? 'bg-[#C9B8AC]'
                            : 'bg-[#B08A7C]'
                      }`}
                    />
                    {index < events.length - 1 && <span className="mt-1 w-px flex-1 bg-[#EDE3DA]" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[0.9rem] leading-snug text-[#3B2730]">
                        {EVENT_LABELS[event.event_type] ?? event.event_type}
                      </p>
                      <Badge tone={TONES[event.event_type] ?? 'neutral'}>
                        {event.event_type.replaceAll('_', ' ')}
                      </Badge>
                    </div>
                    {describeEvent(event.event_type, event.detail) && (
                      <p className="mt-0.5 text-[0.78rem] text-[#8B7570]">
                        {describeEvent(event.event_type, event.detail)}
                      </p>
                    )}
                    <p className="mt-1 text-[0.68rem] uppercase tracking-[0.14em] text-[#A0877C]">
                      {formatDhaka(event.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState title="No submissions yet">
              This timeline fills up as she moves through the experience.
            </EmptyState>
          )}
        </Section>

        <div className="space-y-4">
          <Section title="Proposal answers" description="Recorded only when she chooses a button.">
            {proposals.length ? (
              <ul className="space-y-2">
                {proposals.map((proposal) => (
                  <li
                    key={proposal.id}
                    className="flex items-center justify-between gap-3 rounded-[10px] border border-[#EADFD6] bg-[#FCF8F3] px-3 py-2"
                  >
                    <Badge tone={proposal.answer === 'yes' ? 'green' : 'amber'}>
                      {proposal.answer === 'yes' ? 'Yes' : 'No, not today'}
                    </Badge>
                    <span className="text-[0.72rem] text-[#8B7570]">{formatDhaka(proposal.created_at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No answer recorded yet" />
            )}
          </Section>

          <Section title="Confirmed versions" description="Each deliberate update is kept.">
            {versions.length ? (
              <ul className="space-y-2">
                {versions.map((version) => {
                  const data = version.snapshot as { selectedDate?: string; selectedTime?: string; note?: string };
                  return (
                    <li key={version.id} className="rounded-[10px] border border-[#EADFD6] bg-[#FCF8F3] px-3 py-2">
                      <p className="text-[0.82rem] text-[#3B2730]">
                        v{version.version} · {data.note ?? 'Confirmed plan'}
                      </p>
                      <p className="text-[0.76rem] text-[#8B7570]">
                        {data.selectedDate ? formatCalendarDate(data.selectedDate) : '—'}
                        {data.selectedTime ? ` · ${formatTimeLabel(data.selectedTime)}` : ''}
                      </p>
                      <p className="text-[0.66rem] uppercase tracking-[0.12em] text-[#A0877C]">
                        {formatDhaka(version.created_at)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState title="No confirmed plan yet" />
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
