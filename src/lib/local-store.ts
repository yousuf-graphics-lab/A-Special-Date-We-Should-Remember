/**
 * Local preview storage.
 *
 * This is a complete, persistent data layer used when the website runs without
 * a reachable Supabase project (for example inside an offline preview sandbox).
 * It writes a JSON database and private media files to `.data/`, exposes a
 * Supabase-shaped query surface so the application code stays identical, and
 * never claims to be remote storage — the admin panel always shows which mode
 * is active.
 *
 * Server only. Never import this from a client component.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHmac, randomUUID, createHash, timingSafeEqual } from 'node:crypto';

const ROOT = path.join(process.cwd(), '.data');
const DB_FILE = path.join(ROOT, 'local-db.json');
const UPLOAD_DIR = path.join(ROOT, 'uploads');

type Row = Record<string, any>;

type Database = {
  date_responses: Row[];
  proposal_answers: Row[];
  response_versions: Row[];
  response_events: Row[];
  media_records: Row[];
  date_locations: Row[];
  admin_credentials: Row[];
  admin_activity: Row[];
  request_rate_limits: Row[];
};

const EMPTY_DB: Database = {
  date_responses: [],
  proposal_answers: [],
  response_versions: [],
  response_events: [],
  media_records: [],
  date_locations: [],
  admin_credentials: [],
  admin_activity: [],
  request_rate_limits: [],
};

let queue: Promise<unknown> = Promise.resolve();

function serialise<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

async function readDb(): Promise<Database> {
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<Database>;
    return { ...structuredClone(EMPTY_DB), ...parsed } as Database;
  } catch {
    return structuredClone(EMPTY_DB);
  }
}

async function writeDb(db: Database): Promise<void> {
  await fs.mkdir(ROOT, { recursive: true });
  const temp = `${DB_FILE}.${process.pid}.tmp`;
  await fs.writeFile(temp, JSON.stringify(db, null, 2), 'utf8');
  await fs.rename(temp, DB_FILE);
}

function nowIso() {
  return new Date().toISOString();
}

type QueryResult<T = Row | Row[] | null> = {
  data: T;
  error: { code?: string; message: string } | null;
  count?: number | null;
};

type Filter = { kind: 'eq' | 'in' | 'is'; column: string; value: unknown };

const TABLE_DEFAULTS: Record<string, Row> = {
  date_responses: { proposal_answer: 'yes', status: 'confirmed', time_mode: 'preset', response_version: 1 },
  media_records: { consent: true, sort_order: 0 },
  proposal_answers: {},
  response_versions: {},
  response_events: { detail: {} },
  date_locations: {},
  admin_credentials: {},
  admin_activity: {},
  request_rate_limits: {},
};

const hasUpdatedAt: Record<string, boolean> = {
  date_responses: true,
  date_locations: true,
};

class LocalQuery implements PromiseLike<QueryResult> {
  private op: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private payload: Row | Row[] | null = null;
  private filters: Filter[] = [];
  private ordering: { column: string; ascending: boolean }[] = [];
  private take: number | null = null;
  private mode: 'many' | 'single' | 'maybe' = 'many';
  private wantCount = false;
  private headOnly = false;
  private conflictColumn = 'id';
  private returning = false;

  constructor(private table: keyof Database) {}

  select(_columns?: string, options?: { count?: string; head?: boolean }) {
    if (options?.count === 'exact') this.wantCount = true;
    if (options?.head) this.headOnly = true;
    this.returning = true;
    return this;
  }

  insert(values: Row | Row[]) {
    this.op = 'insert';
    this.payload = values;
    return this;
  }

  upsert(values: Row | Row[], options?: { onConflict?: string }) {
    this.op = 'upsert';
    this.payload = values;
    if (options?.onConflict) this.conflictColumn = options.onConflict;
    return this;
  }

  update(values: Row) {
    this.op = 'update';
    this.payload = values;
    this.returning = true;
    return this;
  }

  delete() {
    this.op = 'delete';
    this.returning = true;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ kind: 'eq', column, value });
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push({ kind: 'in', column, value: values });
    return this;
  }

  is(column: string, value: null | boolean) {
    this.filters.push({ kind: 'is', column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.ordering.push({ column, ascending: options?.ascending !== false });
    return this;
  }

  limit(count: number) {
    this.take = count;
    return this;
  }

  single() {
    this.mode = 'single';
    return this;
  }

  maybeSingle() {
    this.mode = 'maybe';
    return this;
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private matches(row: Row): boolean {
    return this.filters.every((filter) => {
      if (filter.kind === 'eq') return row[filter.column] === filter.value;
      if (filter.kind === 'in') return (filter.value as unknown[]).includes(row[filter.column]);
      if (filter.value === null) return row[filter.column] === null || row[filter.column] === undefined;
      return Boolean(row[filter.column]) === Boolean(filter.value);
    });
  }

  private sort(rows: Row[]): Row[] {
    if (!this.ordering.length) return rows;
    return [...rows].sort((a, b) => {
      for (const rule of this.ordering) {
        const av = a[rule.column];
        const bv = b[rule.column];
        if (av === bv) continue;
        const cmp = av === null || av === undefined ? -1 : bv === null || bv === undefined ? 1 : av > bv ? 1 : -1;
        return rule.ascending ? cmp : -cmp;
      }
      return 0;
    });
  }

  private uniqueError(): QueryResult {
    return {
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    };
  }

  private validateInsert(db: Database, row: Row, ignoreId?: string): QueryResult | null {
    if (this.table === 'media_records') {
      if (db.media_records.some((existing) => existing.storage_path === row.storage_path)) {
        return this.uniqueError();
      }
      const activeDuplicates = db.media_records.filter(
        (existing) =>
          existing.response_id === row.response_id &&
          !existing.deleted_at &&
          (existing.content_hash === row.content_hash ||
            (row.media_type === 'voice' && existing.media_type === 'voice')),
      );
      if (activeDuplicates.length) return this.uniqueError();
    }
    if (this.table === 'date_locations') {
      const clash = db.date_locations.find(
        (existing) => existing.response_id === row.response_id && existing.id !== ignoreId,
      );
      if (clash) return this.uniqueError();
    }
    if (this.table === 'admin_credentials') {
      const clash = db.admin_credentials.find(
        (existing) => existing.username === row.username && existing.id !== ignoreId,
      );
      if (clash) return this.uniqueError();
    }
    return null;
  }

  private finalise(rows: Row[]): QueryResult {
    if (this.mode === 'single') {
      if (rows.length === 0) {
        return {
          data: null,
          error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' },
        };
      }
      return { data: rows[0], error: null, count: rows.length };
    }
    if (this.mode === 'maybe') {
      return { data: rows[0] ?? null, error: null, count: rows.length };
    }
    return { data: rows, error: null, count: this.wantCount ? rows.length : null };
  }

  private async execute(): Promise<QueryResult> {
    return serialise(async () => {
      const db = await readDb();

      if (this.op === 'select') {
        const rows = this.sort(db[this.table].filter((row) => this.matches(row)));
        const sliced = this.take ? rows.slice(0, this.take) : rows;

        if (this.headOnly) {
          return { data: null, error: null, count: rows.length };
        }
        return this.finalise(this.mode === 'many' ? sliced : rows);
      }

      if (this.op === 'insert') {
        const incoming = Array.isArray(this.payload) ? this.payload : [this.payload ?? {}];
        const inserted: Row[] = [];

        for (const item of incoming) {
          const row: Row = {
            ...(TABLE_DEFAULTS[this.table] ?? {}),
            id: item.id ?? randomUUID(),
            created_at: item.created_at ?? nowIso(),
            ...(hasUpdatedAt[this.table] ? { updated_at: item.updated_at ?? nowIso() } : {}),
            ...item,
          };
          const invalid = this.validateInsert(db, row);
          if (invalid) return invalid;
          db[this.table].push(row);
          inserted.push(row);
        }

        await writeDb(db);
        if (!this.returning) return { data: null, error: null };
        return this.finalise(inserted);
      }

      if (this.op === 'update') {
        const updated: Row[] = [];
        db[this.table] = db[this.table].map((row) => {
          if (!this.matches(row)) return row;
          const next: Row = {
            ...row,
            ...(this.payload as Row),
            ...(hasUpdatedAt[this.table] ? { updated_at: (this.payload as Row)?.updated_at ?? nowIso() } : {}),
          };
          updated.push(next);
          return next;
        });
        await writeDb(db);
        if (!this.returning) return { data: null, error: null };
        return this.finalise(updated);
      }

      if (this.op === 'delete') {
        const removed: Row[] = [];
        db[this.table] = db[this.table].filter((row) => {
          if (this.matches(row)) {
            removed.push(row);
            return false;
          }
          return true;
        });
        await writeDb(db);
        return this.finalise(removed);
      }

      // upsert
      const items = Array.isArray(this.payload) ? this.payload : [this.payload ?? {}];
      const written: Row[] = [];
      for (const item of items) {
        const key = item[this.conflictColumn];
        const index = db[this.table].findIndex((row) => row[this.conflictColumn] === key);
        if (index >= 0) {
          const next = {
            ...db[this.table][index],
            ...item,
            ...(hasUpdatedAt[this.table] ? { updated_at: nowIso() } : {}),
          };
          db[this.table][index] = next;
          written.push(next);
        } else {
          const row: Row = {
            ...(TABLE_DEFAULTS[this.table] ?? {}),
            id: item.id ?? randomUUID(),
            created_at: item.created_at ?? nowIso(),
            ...(hasUpdatedAt[this.table] ? { updated_at: item.updated_at ?? nowIso() } : {}),
            ...item,
          };
          const invalid = this.validateInsert(db, row);
          if (invalid) return invalid;
          db[this.table].push(row);
          written.push(row);
        }
      }
      await writeDb(db);
      return this.finalise(written);
    });
  }
}

/* -------------------------------------------------------------------------- */
/* Storage                                                                     */
/* -------------------------------------------------------------------------- */

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  webm: 'audio/webm',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  mp3: 'audio/mpeg',
};

function safeUploadPath(relative: string): string | null {
  const normalised = path.normalize(relative).replace(/^([/\\])+/, '');
  if (normalised.includes('..') || !normalised) return null;
  const absolute = path.join(UPLOAD_DIR, normalised);
  if (!absolute.startsWith(UPLOAD_DIR)) return null;
  return absolute;
}

function signingSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || 'for-samiya-local-preview';
}

export function signLocalPath(relative: string, expiresInSeconds = 3600): string {
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const signature = createHmac('sha256', signingSecret())
    .update(`${relative}|${expires}`)
    .digest('base64url');
  return `${expires}.${signature}`;
}

export function verifyLocalPathToken(relative: string, token: string | null): boolean {
  if (!token) return false;
  const [expiresRaw, signature] = token.split('.');
  const expires = Number(expiresRaw);
  if (!expires || !signature || expires * 1000 < Date.now()) return false;
  const expected = createHmac('sha256', signingSecret()).update(`${relative}|${expires}`).digest('base64url');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

class LocalStorageBucket {
  constructor(public readonly bucket: string) {}

  async createSignedUploadUrl(relative: string) {
    const token = signLocalPath(relative, 3600);
    return {
      data: {
        signedUrl: `/api/local-storage/upload?path=${encodeURIComponent(relative)}&token=${encodeURIComponent(token)}`,
        token,
        path: relative,
      },
      error: null,
    };
  }

  async createSignedUrl(relative: string, expiresIn = 120) {
    const token = signLocalPath(relative, expiresIn);
    return {
      data: {
        signedUrl: `/api/local-storage/file?path=${encodeURIComponent(relative)}&token=${encodeURIComponent(token)}`,
      },
      error: null,
    };
  }

  async download(relative: string) {
    const absolute = safeUploadPath(relative);
    if (!absolute) return { data: null, error: { message: 'Invalid path' } };
    try {
      const buffer = await fs.readFile(absolute);
      const ext = path.extname(relative).slice(1).toLowerCase();
      const blob = new Blob([new Uint8Array(buffer)], { type: MIME_BY_EXT[ext] ?? 'application/octet-stream' });
      return { data: blob, error: null };
    } catch {
      return { data: null, error: { message: 'Object not found' } };
    }
  }

  async remove(paths: string[]) {
    const results = await Promise.all(
      paths.map(async (relative) => {
        const absolute = safeUploadPath(relative);
        if (!absolute) return;
        try {
          await fs.unlink(absolute);
        } catch {
          /* already gone */
        }
      }),
    );
    return { data: results, error: null };
  }

  async list(prefix: string, _options?: { limit?: number }) {
    const absolute = safeUploadPath(prefix.replace(/\/$/, ''));
    if (!absolute) return { data: [], error: null };
    try {
      const entries = await fs.readdir(absolute, { withFileTypes: true });
      return {
        data: entries.map((entry) => ({ name: entry.name, id: entry.name, metadata: null })),
        error: null,
      };
    } catch {
      return { data: [], error: null };
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Public client                                                               */
/* -------------------------------------------------------------------------- */

const rateLimitBuckets = new Map<string, { started: number; hits: number }>();

export function createLocalClient() {
  return {
    mode: 'local' as const,
    from(table: keyof Database) {
      return new LocalQuery(table);
    },
    storage: {
      from(bucket: string) {
        return new LocalStorageBucket(bucket);
      },
    },
    async rpc(name: string, params: Record<string, number | string>) {
      if (name !== 'check_rate_limit') {
        return { data: null, error: { message: `Unknown function ${name}` } };
      }
      const key = String(params.p_key ?? '');
      const limit = Number(params.p_limit ?? 30);
      const windowSeconds = Number(params.p_window_seconds ?? 60);
      const now = Date.now();
      const entry = rateLimitBuckets.get(key);
      if (!entry || now - entry.started > windowSeconds * 1000) {
        rateLimitBuckets.set(key, { started: now, hits: 1 });
        return { data: 1 <= limit, error: null };
      }
      entry.hits += 1;
      return { data: entry.hits <= limit, error: null };
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Direct file helpers for local uploads                                       */
/* -------------------------------------------------------------------------- */

export async function writeLocalUpload(relative: string, data: Uint8Array): Promise<boolean> {
  const absolute = safeUploadPath(relative);
  if (!absolute) return false;
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, data);
  return true;
}

export async function readLocalUploadHead(
  relative: string,
  length = 8192,
): Promise<{ head: Uint8Array; size: number } | null> {
  const absolute = safeUploadPath(relative);
  if (!absolute) return null;
  try {
    const handle = await fs.open(absolute, 'r');
    try {
      const stat = await handle.stat();
      const buffer = new Uint8Array(Math.min(length, stat.size));
      await handle.read(buffer, 0, buffer.length, 0);
      return { head: buffer, size: stat.size };
    } finally {
      await handle.close();
    }
  } catch {
    return null;
  }
}

export async function localFileExists(relative: string): Promise<boolean> {
  const absolute = safeUploadPath(relative);
  if (!absolute) return false;
  try {
    await fs.access(absolute);
    return true;
  } catch {
    return false;
  }
}

export function localContentHash(head: Uint8Array, size: number): string {
  return createHash('sha256').update(Buffer.from(head)).update(String(size)).digest('hex').slice(0, 48);
}

export async function readLocalFile(relative: string): Promise<{ data: ArrayBuffer; size: number } | null> {
  const absolute = safeUploadPath(relative);
  if (!absolute) return null;
  try {
    const buffer = await fs.readFile(absolute);
    return { data: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer, size: buffer.byteLength };
  } catch {
    return null;
  }
}
