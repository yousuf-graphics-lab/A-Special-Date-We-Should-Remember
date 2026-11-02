import Link from 'next/link';
import { getAdminSnapshot } from '@/lib/admin-data';
import { formatDhaka, formatDuration } from '@/lib/time';
import { Badge, DetailRow, EmptyState, PageHeader, Section } from '@/components/admin/ui';
import { RefreshButton } from '@/components/admin/refresh-button';
import { ConfirmButton } from '@/components/admin/confirm-button';

export const dynamic = 'force-dynamic';

export default async function VoiceMessagePage() {
  const snapshot = await getAdminSnapshot({ eventsLimit: 3 });
  const voice = snapshot.media.find((item) => item.media_type === 'voice') ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Optional sharing"
        title="Voice Message"
        subtitle="A recording Samiya chose to leave. Playback is only possible through this authenticated panel."
        actions={<RefreshButton />}
      />

      {!snapshot.backendConfigured ? (
        <Section>
          <EmptyState title="Backend not configured">
            Configure Supabase before any media can be saved or played.
          </EmptyState>
        </Section>
      ) : voice ? (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Section title="Listen" description="Her private note to Yousuf.">
            <audio controls preload="metadata" src={`/api/admin/media/${voice.id}`} className="w-full">
              Your browser does not support audio playback.
            </audio>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge tone="green">submitted</Badge>
              <Badge>{voice.duration_seconds ? formatDuration(Number(voice.duration_seconds)) : 'duration unavailable'}</Badge>
              <Badge>{voice.mime_type}</Badge>
            </div>
            <p className="mt-4 text-[0.82rem] leading-relaxed text-[#7A6565]">
              This file lives in a private storage bucket. It is streamed only after your signed-in session is
              verified, and it is never exposed through a public URL.
            </p>
          </Section>

          <Section title="Details">
            <dl>
              <DetailRow label="Submitted">{formatDhaka(voice.created_at)}</DetailRow>
              <DetailRow label="Duration">
                {voice.duration_seconds ? formatDuration(Number(voice.duration_seconds)) : 'Not reported'}
              </DetailRow>
              <DetailRow label="Size">{Math.round(voice.byte_size / 1024)} KB</DetailRow>
              <DetailRow label="Consent recorded">{voice.consent ? 'Yes — she submitted it herself' : 'No'}</DetailRow>
              <DetailRow label="Recording">
                <Link href="/admin/response" className="text-[#8C4655] underline decoration-[#DCC3BC] underline-offset-4">
                  Back to date response
                </Link>
              </DetailRow>
            </dl>
            <div className="mt-4">
              <ConfirmButton
                label="Delete voice message"
                title="Delete her voice message?"
                description="The recording will be permanently removed from private storage. This cannot be undone."
                endpoint={`/api/admin/media/${voice.id}`}
              />
            </div>
          </Section>
        </div>
      ) : (
        <Section>
          <EmptyState title="No voice message has been shared.">
            This was completely optional. If she records one, it will appear here.
          </EmptyState>
        </Section>
      )}
    </div>
  );
}
