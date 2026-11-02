'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Expand, Loader2, Trash2, X } from 'lucide-react';
import { clsx } from 'clsx';

export type GalleryPhoto = {
  id: string;
  url: string;
  order: number;
  createdAt: string;
  byteSize: number;
  mimeType: string;
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PhotoGallery({ photos }: { photos: GalleryPhoto[] }) {
  const router = useRouter();
  const [active, setActive] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (active === null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setActive(null);
      if (event.key === 'ArrowRight') setActive((current) => (current === null ? null : Math.min(photos.length - 1, current + 1)));
      if (event.key === 'ArrowLeft') setActive((current) => (current === null ? null : Math.max(0, current - 1)));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, photos.length]);

  async function remove(id: string) {
    setDeleting(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/media/${id}`, { method: 'DELETE' });
      const body = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !body?.ok) {
        setError(body?.error || 'That photo could not be deleted.');
        setDeleting(null);
        return;
      }
      setActive(null);
      setDeleting(null);
      router.refresh();
    } catch {
      setError('The connection failed. Please try again.');
      setDeleting(null);
    }
  }

  const current = active !== null ? photos[active] : null;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo, index) => (
          <figure
            key={photo.id}
            className="group relative overflow-hidden rounded-[12px] border border-[#E7DCD2] bg-white/70"
          >
            <button
              type="button"
              onClick={() => setActive(index)}
              className="block aspect-square w-full overflow-hidden"
              aria-label={`Open photo ${index + 1} larger`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={`Photo ${index + 1} shared by Samiya`}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />
              <span className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/45 via-transparent to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                <span className="rounded-full bg-white/85 px-2 py-0.5 text-[0.58rem] uppercase tracking-[0.14em] text-[#3B2730]">
                  #{photo.order}
                </span>
                <Expand className="h-3.5 w-3.5 text-white/90" strokeWidth={1.6} />
              </span>
            </button>
            <figcaption className="flex items-center justify-between gap-2 px-2.5 py-2 text-[0.66rem] text-[#8B7570]">
              <span>{photo.createdAt}</span>
              <span>{formatSize(photo.byteSize)}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      {error && <p className="mt-3 text-[0.8rem] text-[#8E3F3F]">{error}</p>}

      {current && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1D1116]/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${current.order}`}
        >
          <div className="relative flex max-h-[92svh] w-full max-w-[54rem] flex-col overflow-hidden rounded-[14px] bg-[#FCF8F3]">
            <div className="flex items-center justify-between gap-3 border-b border-[#EADFD6] px-4 py-3">
              <div>
                <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[#9A7C74]">
                  Photo #{current.order}
                </p>
                <p className="text-[0.78rem] text-[#7A6565]">
                  {current.createdAt} · {formatSize(current.byteSize)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => remove(current.id)}
                  disabled={deleting === current.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E3C7C3] px-3 py-1.5 text-[0.64rem] uppercase tracking-[0.14em] text-[#8E3F3F] transition hover:bg-[#FBEEEC] disabled:opacity-60"
                >
                  {deleting === current.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" strokeWidth={1.6} />
                  )}
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#DDCEC4] text-[#6D575B] transition hover:bg-white"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" strokeWidth={1.8} />
                </button>
              </div>
            </div>

            <div className="relative flex flex-1 items-center justify-center overflow-auto bg-[#F3EBE3] p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.url}
                alt={`Photo ${current.order} shared by Samiya`}
                className="max-h-[70svh] w-auto max-w-full rounded-[6px] object-contain shadow-lg"
              />
            </div>

            {photos.length > 1 && (
              <div className="flex items-center justify-between border-t border-[#EADFD6] px-4 py-3">
                <button
                  type="button"
                  onClick={() => setActive((value) => (value === null ? null : Math.max(0, value - 1)))}
                  disabled={active === 0}
                  className={clsx(
                    'inline-flex items-center gap-1.5 rounded-full border border-[#DDCEC4] px-3 py-1.5 text-[0.64rem] uppercase tracking-[0.14em] text-[#6D575B] transition hover:bg-white',
                    active === 0 && 'opacity-40',
                  )}
                >
                  <ChevronLeft className="h-3 w-3" /> Previous
                </button>
                <span className="text-[0.68rem] text-[#8B7570]">
                  {active! + 1} of {photos.length}
                </span>
                <button
                  type="button"
                  onClick={() => setActive((value) => (value === null ? null : Math.min(photos.length - 1, value + 1)))}
                  disabled={active === photos.length - 1}
                  className={clsx(
                    'inline-flex items-center gap-1.5 rounded-full border border-[#DDCEC4] px-3 py-1.5 text-[0.64rem] uppercase tracking-[0.14em] text-[#6D575B] transition hover:bg-white',
                    active === photos.length - 1 && 'opacity-40',
                  )}
                >
                  Next <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
