'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Mic, Play, RotateCcw, Square, Trash2, Upload, Check, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { OPTIONAL_COPY } from '@/lib/content';
import { uploadFile } from '@/lib/api-client';
import { formatDuration } from '@/lib/time';
import type { PublicMediaItem } from '@/lib/responses';

type RecorderState = 'idle' | 'requesting' | 'recording' | 'recorded' | 'uploading' | 'submitted' | 'error';

const PREFERRED_MIME = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/ogg',
];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  return PREFERRED_MIME.find((type) => MediaRecorder.isTypeSupported(type));
}

export function VoiceRecorder({
  token,
  pendingPath,
  existing,
  onPendingChange,
  onRemoveExisting,
}: {
  token: string;
  pendingPath: string | null;
  existing: PublicMediaItem | null;
  onPendingChange: (media: { path: string; duration: number } | null) => void;
  onRemoveExisting: (mediaId: string) => Promise<void>;
}) {
  const copy = OPTIONAL_COPY.voice;
  const [state, setState] = useState<RecorderState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [removingExisting, setRemovingExisting] = useState(false);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const urlRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef(0);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    cleanupStream();
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, [cleanupStream]);

  const releaseRecording = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setAudioUrl(null);
    blobRef.current = null;
    chunksRef.current = [];
    setDuration(0);
  }, []);

  async function startRecording() {
    setError(null);
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setState('error');
      setError('This browser cannot record audio. You can skip this with no worries.');
      return;
    }

    setState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      releaseRecording();

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        blobRef.current = blob;
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        setAudioUrl(url);
        setDuration(Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)));
        setState('recorded');
        cleanupStream();
      };

      recorder.start();
      startedAt.current = Date.now();
      setDuration(0);
      setState('recording');
      timerRef.current = setInterval(() => {
        const seconds = Math.round((Date.now() - startedAt.current) / 1000);
        setDuration(seconds);
        if (seconds >= 180) {
          recorder.stop();
        }
      }, 500);

      mediaRecorder.current = recorder;
    } catch (err) {
      cleanupStream();
      setState('error');
      const name = err instanceof DOMException ? err.name : '';
      setError(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? "Your browser didn't share the microphone. No problem at all — you can skip this, or try again."
          : 'The microphone could not be started. You can skip this with no worries.',
      );
    }
  }

  function stopRecording() {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }
  }

  async function submitRecording() {
    if (!blobRef.current) return;
    setState('uploading');
    setError(null);
    const blob = blobRef.current;
    const mime = blob.type || 'audio/webm';
    const result = await uploadFile(token, 'voice', blob, mime, blob.size);
    if (!result.ok) {
      setState('recorded');
      setError(result.error);
      return;
    }
    onPendingChange({ path: result.data.path, duration });
    setState('submitted');
  }

  async function discard() {
    const path = pendingPath;
    releaseRecording();
    setState('idle');
    setError(null);
    onPendingChange(null);
    if (path) {
      // Remove the private upload that was never attached to her plan.
      try {
        await fetch('/api/upload-url', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, path }),
        });
      } catch {
        /* best effort */
      }
    }
  }

  const recording = state === 'recording';
  const submitted = state === 'submitted' && Boolean(pendingPath);
  const hasExisting = Boolean(existing);

  return (
    <section
      aria-labelledby="voice-heading"
      className="soft-card relative overflow-hidden rounded-[16px] p-5 sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow text-[0.58rem] text-rose-deep/70">{copy.eyebrow}</p>
          <h3 id="voice-heading" className="display-sub mt-1.5 text-wine-deep">
            {copy.title}
          </h3>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-wine/12 bg-white/60 text-wine/70">
          <Mic className="h-4 w-4" strokeWidth={1.5} />
        </span>
      </div>

      <p className="prose-body mt-3 text-[0.9rem] leading-[1.8]">{copy.body}</p>
      <p className="mt-2 text-[0.78rem] leading-relaxed text-ink-soft/70">{copy.privacy}</p>

      {hasExisting && (
        <div className="mt-5 rounded-[12px] border border-gold/30 bg-white/55 p-4">
          <p className="text-[0.65rem] uppercase tracking-[0.22em] text-wine/60">Shared with Yousuf</p>
          <audio controls src={existing?.url} className="mt-2">
            Your browser does not support audio playback.
          </audio>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-[0.78rem] text-ink-soft/70">
              {existing?.durationSeconds ? formatDuration(existing.durationSeconds) : 'Voice message'}
            </p>
            <button
              type="button"
              onClick={async () => {
                if (!existing) return;
                setRemovingExisting(true);
                await onRemoveExisting(existing.id);
                setRemovingExisting(false);
              }}
              disabled={removingExisting}
              className="inline-flex items-center gap-1.5 text-[0.72rem] uppercase tracking-[0.16em] text-wine/70 transition hover:text-wine disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              {removingExisting ? 'Removing…' : 'Remove'}
            </button>
          </div>
        </div>
      )}

      <div className="mt-5">
        <AnimatePresence mode="wait">
          {state === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <button type="button" onClick={startRecording} className="btn btn-ghost w-full sm:w-auto">
                <Mic className="h-4 w-4" strokeWidth={1.6} />
                {hasExisting ? 'Record a new message' : copy.record}
              </button>
            </motion.div>
          )}

          {state === 'requesting' && (
            <motion.p key="requesting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[0.85rem] text-ink-soft">
              Waiting for your microphone permission…
            </motion.p>
          )}

          {recording && (
            <motion.div key="recording" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-4 rounded-[12px] border border-rose-deep/25 bg-blush-soft/60 px-4 py-4">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-deep/60" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-deep" />
                </span>
                <div className="flex flex-1 items-end gap-[3px]" aria-hidden>
                  {Array.from({ length: 22 }).map((_, index) => (
                    <motion.span
                      key={index}
                      className="w-[3px] rounded-full bg-rose-deep/60"
                      animate={{ height: [4, 6 + ((index * 7) % 18), 4] }}
                      transition={{ duration: 0.9 + (index % 5) * 0.12, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  ))}
                </div>
                <span className="font-display text-[0.95rem] tabular-nums text-wine">{formatDuration(duration)}</span>
                <button type="button" onClick={stopRecording} className="btn btn-primary px-4 py-2 text-[0.7rem]">
                  <Square className="h-3 w-3" strokeWidth={2} fill="currentColor" />
                  {copy.stop}
                </button>
              </div>
            </motion.div>
          )}

          {(state === 'recorded' || state === 'uploading') && audioUrl && (
            <motion.div key="recorded" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="rounded-[12px] border border-gold/30 bg-white/55 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[0.65rem] uppercase tracking-[0.22em] text-wine/60">Listen before you share</p>
                  <span className="font-display text-[0.86rem] tabular-nums text-ink-soft">{formatDuration(duration)}</span>
                </div>
                <audio controls src={audioUrl} className="mt-2">
                  Your browser does not support audio playback.
                </audio>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={submitRecording}
                  disabled={state === 'uploading'}
                  className="btn btn-primary px-5 py-2.5 text-[0.72rem]"
                >
                  <Upload className="h-3.5 w-3.5" strokeWidth={1.6} />
                  {state === 'uploading' ? 'Saving…' : copy.submit}
                </button>
                <button type="button" onClick={startRecording} className="btn btn-ghost px-4 py-2.5 text-[0.7rem]">
                  <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.6} />
                  {copy.again}
                </button>
                <button type="button" onClick={discard} className="btn btn-ghost px-4 py-2.5 text-[0.7rem]">
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.6} />
                  {copy.remove}
                </button>
              </div>
            </motion.div>
          )}

          {submitted && (
            <motion.div
              key="submitted"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[12px] border border-[#8BA37D]/40 bg-[#F3F6ED]/80 p-4"
            >
              <p className="flex items-center gap-2 text-[0.88rem] text-[#4F6547]">
                <Check className="h-4 w-4" strokeWidth={2} />
                {copy.submitted}
              </p>
              <p className="mt-1 text-[0.78rem] leading-relaxed text-[#5D6B55]/80">
                It will be attached to our little plan when you confirm. You can delete it any time before then.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {audioUrl && (
                  <audio controls src={audioUrl} className="max-w-full flex-1">
                    Your browser does not support audio playback.
                  </audio>
                )}
                <button
                  type="button"
                  onClick={discard}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#8BA37D]/40 px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.16em] text-[#4F6547] transition hover:bg-white/60"
                >
                  <Trash2 className="h-3 w-3" strokeWidth={1.6} />
                  Delete
                </button>
              </div>
            </motion.div>
          )}

          {state === 'error' && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[12px] bg-[#FBEDEA] p-4">
              <p className="flex items-start gap-2 text-[0.85rem] leading-relaxed text-[#8E3F3F]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.6} />
                {error}
              </p>
              <button type="button" onClick={startRecording} className="btn btn-ghost mt-3 px-4 py-2 text-[0.7rem]">
                <Play className="h-3.5 w-3.5" strokeWidth={1.6} />
                Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {error && state !== 'error' && (
          <p className="mt-2 text-[0.8rem] text-[#8E3F3F]">{error}</p>
        )}

        <p className={clsx('mt-4 text-[0.72rem] uppercase tracking-[0.16em] text-ink-soft/50')}>{copy.skip}</p>
      </div>
    </section>
  );
}
