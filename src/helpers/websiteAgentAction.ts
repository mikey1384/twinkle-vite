// While Zero or Ciel are tapping or typing in this tab, and for a few seconds
// after, every API request says so. The server uses it to refuse XP and coin
// activities done by the agent instead of the user.
export const WEBSITE_AGENT_ACTION_HEADER = 'x-twinkle-agent-action';
const AGENT_ACTION_WINDOW_MS = 5000;

let agentActionUntil = 0;

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
    if (event.isTrusted) agentActionUntil = 0;
  };
  window.addEventListener('pointerdown', endOnUserInput, true);
  window.addEventListener('keydown', endOnUserInput, true);
}
