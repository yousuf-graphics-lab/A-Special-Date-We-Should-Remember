import { ExternalLink, MapPin, Navigation } from 'lucide-react';
import { getAdminSnapshot } from '@/lib/admin-data';
import { formatDhaka } from '@/lib/time';
import { SOURCE_LABELS } from '@/lib/admin-labels';
import { Badge, DetailRow, EmptyState, PageHeader, Section } from '@/components/admin/ui';
import { RefreshButton } from '@/components/admin/refresh-button';
import { ConfirmButton } from '@/components/admin/confirm-button';

export const dynamic = 'force-dynamic';

export default async function SharedLocationPage() {
  const snapshot = await getAdminSnapshot({ eventsLimit: 3 });
  const location = snapshot.location;
  const hasCoords = Boolean(location && location.latitude !== null && location.longitude !== null);
  const lat = location?.latitude ?? null;
  const lng = location?.longitude ?? null;

  const embedUrl =
    hasCoords && lat !== null && lng !== null
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.012}%2C${lat - 0.008}%2C${lng + 0.012}%2C${lat + 0.008}&layer=mapnik&marker=${lat}%2C${lng}`
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Optional sharing"
        title="Shared Location"
        subtitle="Only a place she deliberately submitted. There is no live tracking anywhere in this website."
        actions={<RefreshButton />}
      />

      {!location ? (
        <Section>
          <EmptyState title="No location has been shared.">
            She can confirm the date without sharing a location.
          </EmptyState>
        </Section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
          <Section title="The place she chose">
            <dl>
              <DetailRow label="Place">
                {location.place_name || (
                  <span className="text-[#8B7570]">No name typed — coordinates only</span>
                )}
              </DetailRow>
              <DetailRow label="How it was shared">
                <Badge tone={location.source === 'device' ? 'rose' : 'neutral'}>
                  {SOURCE_LABELS[location.source]}
                </Badge>
              </DetailRow>
              {hasCoords && (
                <>
                  <DetailRow label="Latitude" mono>
                    {lat?.toFixed(6)}
                  </DetailRow>
                  <DetailRow label="Longitude" mono>
                    {lng?.toFixed(6)}
                  </DetailRow>
                  <DetailRow label="Accuracy">
                    {location.accuracy_meters ? `± ${Math.round(location.accuracy_meters)} m` : 'Not reported'}
                  </DetailRow>
                </>
              )}
              <DetailRow label="Submitted">{formatDhaka(location.created_at)}</DetailRow>
              <DetailRow label="Last updated">{formatDhaka(location.updated_at)}</DetailRow>
            </dl>

            <div className="mt-4 flex flex-wrap gap-2">
              {hasCoords && (
                <a
                  href={`https://www.google.com/maps?q=${lat},${lng}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 rounded-full border border-[#DDCEC4] bg-white/70 px-3.5 py-2 text-[0.66rem] uppercase tracking-[0.14em] text-[#6D575B] transition hover:bg-white"
                >
                  <ExternalLink className="h-3 w-3" strokeWidth={1.6} />
                  Open in Google Maps
                </a>
              )}
              {location.place_name && (
                <a
                  href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(location.place_name)}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 rounded-full border border-[#DDCEC4] bg-white/70 px-3.5 py-2 text-[0.66rem] uppercase tracking-[0.14em] text-[#6D575B] transition hover:bg-white"
                >
                  <MapPin className="h-3 w-3" strokeWidth={1.6} />
                  Search the place
                </a>
              )}
            </div>

            <p className="mt-4 rounded-[10px] bg-[#FBF7F2] p-3 text-[0.76rem] leading-relaxed text-[#8B7570]">
              {location.source === 'device'
                ? 'These coordinates were shared once, at the moment she pressed “Share My Current Location”. They are stored as a single location — not a live position.'
                : 'This is a place she typed in herself. It is not a verified current location.'}
            </p>

            <div className="mt-4">
              <ConfirmButton
                label="Delete shared location"
                title="Delete the shared location?"
                description="The place she shared will be removed from her response. This cannot be undone."
                endpoint="/api/admin/location"
              />
            </div>
          </Section>

          <Section title="Map preview" description="Approximate preview from OpenStreetMap.">
            {embedUrl ? (
              <div className="overflow-hidden rounded-[12px] border border-[#E7DCD2]">
                <iframe
                  title="Map preview of the shared location"
                  src={embedUrl}
                  className="h-[320px] w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="flex h-[240px] flex-col items-center justify-center rounded-[12px] border border-dashed border-[#DCCEC4] bg-[#FBF7F2] text-center">
                <Navigation className="h-5 w-5 text-[#B08A7C]" strokeWidth={1.4} />
                <p className="mt-2 max-w-xs text-[0.82rem] leading-relaxed text-[#8B7570]">
                  She typed a place name rather than sharing coordinates, so there is no map pin — just the place
                  she chose.
                </p>
              </div>
            )}
          </Section>
        </div>
      )}
    </div>
  );
}
