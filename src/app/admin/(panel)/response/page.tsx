import Link from 'next/link';
import { getAdminSnapshot, getResponseVersions } from '@/lib/admin-data';
import { ACTIVITY_LABELS, type ActivityId } from '@/lib/content';
import { formatCalendarDate, formatDhaka, formatTimeLabel } from '@/lib/time';
import { Badge, DetailRow, EmptyState, PageHeader, Section } from '@/components/admin/ui';
import { RefreshButton } from '@/components/admin/refresh-button';
import { ConfirmButton } from '@/components/admin/confirm-button';

export const dynamic = 'force-dynamic';

export default async function DateResponsePage() {
  const snapshot = await getAdminSnapshot({ eventsLimit: 3 });
  const { response, media, location, proposals } = snapshot;
  const voice = media.find((item) => item.media_type === 'voice') ?? null;
  const photos = media.filter((item) => item.media_type === 'photo');
  const versions = response ? await getResponseVersions(response.id) : [];
  const latestProposal = proposals[0] ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="The details"
        title="Date Response"
        subtitle="Everything Samiya actually submitted, exactly as saved. Her selected day and time are her preferred plan for us — not a real-world booking."
        actions={<RefreshButton />}
      />

      {!response ? (
        <Section>
          <EmptyState title="No date response yet">
            She hasn&apos;t confirmed a little plan so far.{' '}
            {latestProposal
              ? `Her latest answer was “${latestProposal.answer === 'yes' ? 'Yes' : 'No, not today'}” on ${formatDhaka(latestProposal.created_at)}.`
              : 'No proposal answer has been recorded yet.'}
          </EmptyState>
        </Section>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <Section title="Her little plan">
              <dl>
                <DetailRow label="Date proposal answer">
                  <span className="inline-flex items-center gap-2">
                    <Badge tone="green">Yes — she said yes</Badge>
                    <span className="text-[0.78rem] text-[#8B7570]">
                      {formatDhaka(response.created_at)}
                    </span>
                  </span>
                </DetailRow>
                <DetailRow label="Selected date">{formatCalendarDate(response.selected_date)}</DetailRow>
                <DetailRow label="Selected time">
                  {formatTimeLabel(response.selected_time)}
                  {response.time_mode === 'custom' && (
                    <span className="ml-2 text-[0.74rem] text-[#8B7570]">(a custom time)</span>
                  )}
                </DetailRow>
                <DetailRow label="Preferred activity">
                  {ACTIVITY_LABELS[response.selected_activity as ActivityId] ?? response.selected_activity}
                </DetailRow>
                <DetailRow label="Custom activity">
                  {response.custom_activity ?? <span className="text-[#9A8580]">Not provided</span>}
                </DetailRow>
                <DetailRow label="Her personal message">
                  {response.personal_message ? (
                    <span className="whitespace-pre-line">{response.personal_message}</span>
                  ) : (
                    <span className="text-[#9A8580]">She left this empty — that was optional.</span>
                  )}
                </DetailRow>
              </dl>
            </Section>

            <div className="space-y-4">
              <Section title="Status">
                <dl>
                  <DetailRow label="Response status">
                    <Badge tone="green">{response.status}</Badge>
                  </DetailRow>
                  <DetailRow label="Plan version">v{response.response_version}</DetailRow>
                  <DetailRow label="Submitted">{formatDhaka(response.created_at)}</DetailRow>
                  <DetailRow label="Last updated">{formatDhaka(response.updated_at)}</DetailRow>
                  <DetailRow label="Timezone">Asia/Dhaka (GMT+6)</DetailRow>
                </dl>
              </Section>

              <Section title="What she chose to share">
                <dl>
                  <DetailRow label="Voice message">
                    {voice ? (
                      <span>
                        Shared{voice.duration_seconds ? ` · ${Math.round(Number(voice.duration_seconds))}s` : ''}{' '}
                        <Link href="/admin/voice" className="ml-1 text-[#8C4655] underline decoration-[#DCC3BC] underline-offset-4">
                          listen
                        </Link>
                      </span>
                    ) : (
                      <span className="text-[#9A8580]">No voice message has been shared.</span>
                    )}
                  </DetailRow>
                  <DetailRow label="Photos">
                    {photos.length ? (
                      <span>
                        {photos.length} of 5 ·{' '}
                        <Link href="/admin/photos" className="text-[#8C4655] underline decoration-[#DCC3BC] underline-offset-4">
                          open gallery
                        </Link>
                      </span>
                    ) : (
                      <span className="text-[#9A8580]">No photos have been shared yet.</span>
                    )}
                  </DetailRow>
                  <DetailRow label="Location">
                    {location ? (
                      <span>
                        {location.place_name ||
                          (location.latitude !== null && location.longitude !== null
                            ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                            : 'Shared')}{' '}
                        ·{' '}
                        <Link href="/admin/location" className="text-[#8C4655] underline decoration-[#DCC3BC] underline-offset-4">
                          view
                        </Link>
                      </span>
                    ) : (
                      <span className="text-[#9A8580]">No location has been shared.</span>
                    )}
                  </DetailRow>
                </dl>
              </Section>
            </div>
          </div>

          <Section
            title="Submission history"
            description="Every confirmed version of her plan is kept here, so earlier choices are never lost."
          >
            {versions.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-left text-[0.84rem]">
                  <thead>
                    <tr className="text-[0.6rem] uppercase tracking-[0.18em] text-[#9A7C74]">
                      <th className="border-b border-[#EADFD6] pb-2 pr-4 font-normal">Version</th>
                      <th className="border-b border-[#EADFD6] pb-2 pr-4 font-normal">Recorded</th>
                      <th className="border-b border-[#EADFD6] pb-2 pr-4 font-normal">Plan</th>
                      <th className="border-b border-[#EADFD6] pb-2 font-normal">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {versions.map((version) => {
                      const snapshotData = version.snapshot as {
                        selectedDate?: string;
                        selectedTime?: string;
                        activity?: string;
                        note?: string;
                        customActivity?: string | null;
                      };
                      return (
                        <tr key={version.id} className="align-top">
                          <td className="border-b border-[#F1E9E1] py-2.5 pr-4 text-[#3B2730]">v{version.version}</td>
                          <td className="border-b border-[#F1E9E1] py-2.5 pr-4 text-[#6D575B]">
                            {formatDhaka(version.created_at)}
                          </td>
                          <td className="border-b border-[#F1E9E1] py-2.5 pr-4 text-[#3B2730]">
                            {snapshotData.selectedDate
                              ? `${formatCalendarDate(snapshotData.selectedDate)}${
                                  snapshotData.selectedTime ? ` · ${formatTimeLabel(snapshotData.selectedTime)}` : ''
                                }`
                              : '—'}
                            {snapshotData.customActivity ? (
                              <span className="block text-[0.76rem] text-[#8B7570]">{snapshotData.customActivity}</span>
                            ) : null}
                          </td>
                          <td className="border-b border-[#F1E9E1] py-2.5 text-[#8B7570]">
                            {snapshotData.note ?? 'Confirmed plan'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No versions recorded yet" />
            )}
          </Section>

          <Section
            title="Delete this response"
            description="This permanently removes her date response, its version history, any voice message, photos and location. The submission timeline keeps a record that it was deleted."
          >
            <ConfirmButton
              label="Delete her response and media"
              title="Delete her response?"
              description="Her plan, photos, voice message and location will be permanently deleted. This cannot be undone."
              endpoint="/api/admin/response"
            />
          </Section>
        </>
      )}
    </div>
  );
}
