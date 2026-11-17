// While Zero or Ciel are tapping or typing in this tab, and for a few seconds
// after, every API request says so. The server uses it to refuse XP and coin
// activities done by the agent instead of the user.
export const WEBSITE_AGENT_ACTION_HEADER = 'x-twinkle-agent-action';
const AGENT_ACTION_WINDOW_MS = 5000;

let agentActionUntil = 0;
let delivery: { actionId: string; token: string } | null = null;
const requests = new Set<Promise<unknown>>();

export function beginWebsiteAgentDelivery(actionId: string, token: string) {
  delivery = { actionId, token };
}

export function websiteAgentRequestHeaders() {
  if (!isWebsiteAgentActionActive() || !delivery) return {};
  return {
    'x-twinkle-agent-action-id': delivery.actionId,
    'x-twinkle-agent-claim': delivery.token,
    'x-twinkle-agent-request-id': crypto.randomUUID()
  };
}

export function trackWebsiteAgentRequest<T>(request: Promise<T>) {
  if (!delivery || !isWebsiteAgentActionActive()) return request;
  requests.add(request);
  void request.then(
    () => requests.delete(request),
    () => requests.delete(request)
  );
  return request;
}

export async function finishWebsiteAgentDelivery() {
  // Keep the existing attribution window through debounced saves too. UI
  // interaction completion is not the completion of its asynchronous writes.
  const deadline = Date.now() + 10_000;
  try {
    while (
      Date.now() < deadline &&
      (isWebsiteAgentActionActive() || requests.size)
    ) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  } finally {
    delivery = null;
    agentActionUntil = 0;
    requests.clear();
  }
}

export function markWebsiteAgentAction(now = Date.now()) {
  agentActionUntil = now + AGENT_ACTION_WINDOW_MS;
}

export function isWebsiteAgentActionActive(now = Date.now()) {
  return now < agentActionUntil;
}

// The user's own tap or key ends the window: what follows is theirs (Zero
// opens AI Stories, the user taps Read right away). The agent's taps are
// synthetic events, so they never end it.
if (typeof window !== 'undefined') {
  const endOnUserInput = (event: Event) => {
    if (event.isTrusted) {
      agentActionUntil = 0;
      delivery = null;
    }
  };
  window.addEventListener('pointerdown', endOnUserInput, true);
  window.addEventListener('keydown', endOnUserInput, true);
}
