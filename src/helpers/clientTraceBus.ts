// The hand-off between code that can reload the page (chunk recovery, client
// updates, history fallbacks, error screens...) and the client traces: the
// owner trace (ownerTrace.ts) and the member trace (memberTrace.ts), which
// installs itself here at boot. No imports, so the low-level helpers that call
// it stay free of the trace modules (and testable in node, where nothing is
// installed and every call is a no-op).
//
// Every call is a cheap no-op unless the signed-in user is being traced, and
// never throws into the caller.

export interface ClientTraceSink {
  // the owner's trace or the member's, whichever is on
  record(type: string, data?: Record<string, unknown>): void;
  // the member trace only (the owner trace already records these itself)
  recordMember(type: string, data?: Record<string, unknown>): void;
  // A self-reload is about to happen: recorded with its reason and kept on
  // the device before the page goes, so the next load can send it.
  reload(reason: string, data?: Record<string, unknown>): void;
}

let sink: ClientTraceSink | null = null;

export function setClientTraceSink(next: ClientTraceSink | null) {
  sink = next;
}

export function recordClientTrace(
  type: string,
  data?: Record<string, unknown>
) {
  try {
    sink?.record(type, data);
  } catch {
    // Tracing must never affect the page.
  }
}

export function recordMemberClientTrace(
  type: string,
  data?: Record<string, unknown>
) {
  try {
    sink?.recordMember(type, data);
  } catch {
    // Tracing must never affect the page.
  }
}

// Call right before the page reloads or replaces itself.
export function noteClientReload(
  reason: string,
  data?: Record<string, unknown>
) {
  try {
    sink?.reload(reason, data);
  } catch {
    // Tracing must never affect the page.
  }
}

// window.location.reload() with its reason recorded first.
export function reloadPageWithTrace(
  reason: string,
  data?: Record<string, unknown>
) {
  noteClientReload(reason, data);
  window.location.reload();
}
