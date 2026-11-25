// A signed-out visitor's private storage on an app's own address: the
// app's Twinkle.privateDb answers from this device (this origin's
// localStorage, one record per app) instead of asking them to sign in. When
// they sign in or sign up from the app, the lite host carries it into their
// account (POST /build/:id/app-session/carryover): only keys the account
// doesn't have yet, only the app's private storage (which the player could
// write anyway), so it never grants Coins, XP, rewards or leaderboard places.
// The answers have the same shapes as the API's private-db routes, so the
// app can't tell the difference.

export interface GuestPrivateItem {
  id: number;
  key: string;
  value: unknown;
  updatedAt: number;
}

interface GuestRecord {
  v: 1;
  guestId: string;
  nextId: number;
  items: Record<string, { id: number; value: unknown; updatedAt: number }>;
  operations: string[];
}

const KEY = (buildId: number) => `lumine-guest-db:${buildId}`;
const MAX_KEYS = 50;
const MAX_BYTES = 256 * 1024;
const KEY_PATTERN = /^[A-Za-z0-9:_./-]{1,120}$/;

function storageError(message: string, code: string, status = 400) {
  const error: any = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

function sameJson(a: unknown, b: unknown) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

export function createGuestStore(buildId: number, guestId: () => string) {
  let memory: GuestRecord | null = null;

  function read(): GuestRecord {
    try {
      const raw = window.localStorage.getItem(KEY(buildId));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.v === 1 && parsed.items && typeof parsed.items === 'object') {
          memory = {
            ...parsed,
            operations: Array.isArray(parsed.operations) ? parsed.operations : []
          };
          return memory as GuestRecord;
        }
      }
    } catch {
      // private mode or a damaged record: this page's copy
    }
    memory ||= { v: 1, guestId: guestId(), nextId: 1, items: {}, operations: [] };
    return memory;
  }

  function write(record: GuestRecord) {
    const text = JSON.stringify(record);
    if (text.length > MAX_BYTES) {
      throw storageError('Guest storage is full. Sign in to save more.', 'guest_storage_full', 413);
    }
    memory = record;
    try {
      window.localStorage.setItem(KEY(buildId), text);
    } catch {
      // this page only
    }
  }

  function validKey(key: unknown) {
    const text = String(key ?? '');
    if (!KEY_PATTERN.test(text)) throw storageError('Invalid key', 'invalid_key');
    return text;
  }

  function toItem(key: string, entry: GuestRecord['items'][string]): GuestPrivateItem {
    return { id: entry.id, key, value: entry.value, updatedAt: entry.updatedAt };
  }

  function put(record: GuestRecord, key: string, value: unknown) {
    if (value === undefined) throw storageError('A value is required', 'invalid_value');
    if (!record.items[key] && Object.keys(record.items).length >= MAX_KEYS) {
      throw storageError('Guest storage is full. Sign in to save more.', 'guest_storage_full', 413);
    }
    const existing = record.items[key];
    record.items[key] = {
      id: existing?.id || record.nextId++,
      value: JSON.parse(JSON.stringify(value)),
      updatedAt: nowSeconds()
    };
  }

  return {
    get(key: unknown) {
      const name = validKey(key);
      const entry = read().items[name];
      return { item: entry ? toItem(name, entry) : null };
    },
    list({ prefix, limit, cursor }: { prefix?: unknown; limit?: unknown; cursor?: any } = {}) {
      const record = read();
      const max = Math.min(Math.max(Number(limit) || 50, 1), 200);
      const after = Number(cursor?.id || 0);
      const start = typeof prefix === 'string' ? prefix.trim() : '';
      const rows = Object.entries(record.items)
        .filter(([key, entry]) => (!start || key.startsWith(start)) && entry.id > after)
        .sort((a, b) => a[1].id - b[1].id)
        .map(([key, entry]) => toItem(key, entry));
      const items = rows.slice(0, max);
      return {
        items,
        ...(rows.length > max ? { cursor: { id: items[items.length - 1].id } } : {})
      };
    },
    set(key: unknown, value: unknown) {
      const name = validKey(key);
      const record = read();
      put(record, name, value);
      write(record);
      return { item: toItem(name, record.items[name]) };
    },
    remove(key: unknown) {
      const name = validKey(key);
      const record = read();
      const deleted = Boolean(record.items[name]);
      delete record.items[name];
      write(record);
      return { success: true, deleted };
    },
    compareAndSet({
      key,
      expectedValue,
      value,
      operationId
    }: {
      key: unknown;
      expectedValue: unknown;
      value: unknown;
      operationId?: unknown;
    }) {
      const name = validKey(key);
      const record = read();
      const current = record.items[name];
      const item = current ? toItem(name, current) : null;
      const op = typeof operationId === 'string' ? operationId.slice(0, 120) : '';
      if (op && record.operations.includes(`${name}|${op}`)) {
        return {
          item,
          applied: false,
          duplicate: true,
          conflict: false,
          matchesSubmittedValue: item !== null && sameJson(item.value, value)
        };
      }
      if (!sameJson(item?.value ?? null, expectedValue ?? null)) {
        return { item, applied: false, duplicate: false, conflict: true };
      }
      put(record, name, value);
      if (op) record.operations = [...record.operations, `${name}|${op}`].slice(-100);
      write(record);
      return {
        item: toItem(name, record.items[name]),
        applied: true,
        duplicate: false,
        conflict: false,
        matchesSubmittedValue: true
      };
    },
    /** What to carry into the account, or null when there's nothing. */
    takeForCarryover() {
      const record = read();
      const entries = Object.entries(record.items).map(([key, entry]) => ({ key, value: entry.value }));
      return entries.length ? { guestId: record.guestId, entries } : null;
    },
    /** After a carry-over the server confirmed: this device starts fresh. */
    clear() {
      memory = null;
      try {
        window.localStorage.removeItem(KEY(buildId));
      } catch {
        // nothing stored
      }
    }
  };
}

export type GuestStore = ReturnType<typeof createGuestStore>;
