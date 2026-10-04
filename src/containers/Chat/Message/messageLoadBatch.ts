// Messages a chat shows before their page arrived complete (a chat opened after
// the app started on another page, a startup subchannel, a socket summary) ask
// for themselves together: the requests made in the same moment are joined
// into one GET /chat/message/batch instead of one request per message.
const WAIT_MS = 16;
const MAX_IDS = 50;

type BatchLoad = (params: {
  messageIds: number[];
}) => Promise<{ messages?: any[]; missingIds?: number[] }>;
type SingleLoad = (params: { messageId: number }) => Promise<any>;
interface Waiter {
  resolve: (message: any) => void;
  reject: (error: any) => void;
}

let waiting = new Map<number, Waiter[]>();
let timer: ReturnType<typeof setTimeout> | null = null;
let loaders: { batch: BatchLoad; single: SingleLoad } | null = null;

export function loadChatMessageInBatch({
  messageId,
  loadBatch,
  loadSingle
}: {
  messageId: number;
  loadBatch: BatchLoad;
  loadSingle: SingleLoad;
}): Promise<any> {
  loaders = { batch: loadBatch, single: loadSingle };
  return new Promise((resolve, reject) => {
    const list = waiting.get(messageId) || [];
    list.push({ resolve, reject });
    waiting.set(messageId, list);
    if (waiting.size >= MAX_IDS) return flush();
    if (!timer) timer = setTimeout(flush, WAIT_MS);
  });
}

function flush() {
  if (timer) clearTimeout(timer);
  timer = null;
  const batch = waiting;
  waiting = new Map();
  if (!batch.size || !loaders) return;
  void send(batch, loaders);
}

async function send(
  batch: Map<number, Waiter[]>,
  { batch: loadBatch, single }: { batch: BatchLoad; single: SingleLoad }
) {
  const settle = (id: number, ok: boolean, value: any) =>
    (batch.get(id) || []).forEach((waiter) =>
      ok ? waiter.resolve(value) : waiter.reject(value)
    );
  const ids = [...batch.keys()];
  let data: { messages?: any[]; missingIds?: number[] } | null = null;
  try {
    data = await loadBatch({ messageIds: ids });
  } catch {
    data = null;
  }
  if (!data || !Array.isArray(data.messages)) {
    // an older server (no batch route) or a failed batch: one at a time, as before
    await Promise.all(
      ids.map((id) =>
        single({ messageId: id }).then(
          (message) => settle(id, true, message),
          (error) => settle(id, false, error)
        )
      )
    );
    return;
  }
  const byId = new Map(data.messages.map((m: any) => [Number(m?.id), m]));
  for (const id of ids) {
    if (byId.has(id)) settle(id, true, byId.get(id));
    else settle(id, false, new Error('Message not found'));
  }
}
