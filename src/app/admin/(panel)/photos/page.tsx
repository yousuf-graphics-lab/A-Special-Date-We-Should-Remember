import { getAdminSnapshot } from '@/lib/admin-data';
import { formatDhaka } from '@/lib/time';
import { Badge, EmptyState, PageHeader, Section } from '@/components/admin/ui';
import { RefreshButton } from '@/components/admin/refresh-button';
import { PhotoGallery } from '@/components/admin/photo-gallery';

export const dynamic = 'force-dynamic';

export default async function PhotoGalleryPage() {
  const snapshot = await getAdminSnapshot({ eventsLimit: 3 });
  const photos = snapshot.media
    .filter((item) => item.media_type === 'photo')
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Optional sharing"
        title="Photo Gallery"
        subtitle="Only the pictures she chose to share, retrieved through your authenticated session."
        actions={<RefreshButton />}
      />

      {!snapshot.backendConfigured ? (
        <Section>
          <EmptyState title="Backend not configured">
            Configure Supabase before photos can be stored or displayed.
          </EmptyState>
        </Section>
      ) : photos.length === 0 ? (
        <Section>
          <EmptyState title="No photos have been shared yet.">
            She can confirm the date without sharing any photos at all — and add them later if she wants.
          </EmptyState>
        </Section>
      ) : (
        <Section
          title={`${photos.length} photo${photos.length === 1 ? '' : 's'} shared`}
          description="Click any photo to view it larger. Deletion removes it from private storage permanently."
          actions={<Badge tone="green">private gallery</Badge>}
        >
          <PhotoGallery
            photos={photos.map((photo) => ({
              id: photo.id,
              url: `/api/admin/media/${photo.id}`,
              order: photo.sort_order,
              createdAt: formatDhaka(photo.created_at),
              byteSize: photo.byte_size,
              mimeType: photo.mime_type,
            }))}
          />
        </Section>
      )}
    </div>
  );
}
