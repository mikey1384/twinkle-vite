// "Connect AI helper": the viewer pairs a local coding agent (Claude Code,
// Codex) with THIS open app tab via a short code and `lumine app-mcp
// <buildId> --code <code>`. The host bridge owns the relay; the pairing hook
// owns the UI state. They talk through these two small interfaces.

export interface AppHelperSessionStatus {
  id: string;
  origin: 'link' | 'pairing';
  source: 'published' | 'workspace';
  allowEdits: boolean;
  helperName: string | null;
  helperAttachedAt: number | null;
  pairingExpiresAt: number | null;
  expiresAt: number | null;
}

// State that must survive the host bridge effect re-running (the iframe does
// not re-announce its tools just because the effect restarted).
export interface AppHelperRelayState {
  announcement: { sourceWindow: Window; handlerNames: string[] } | null;
  paired: {
    sessionId: string;
    connectionId: string;
    attached: boolean;
  } | null;
}

export interface AppHelperBridge {
  // Makes this tab the runtime of a paired session. Resolves once connected.
  attach(input: { sessionId: string; connectionId?: string }): Promise<{
    connectionId: string;
  }>;
  // Stops relaying for the paired session (the caller closes it server-side).
  detach(): void;
}

export interface AppHelperEvents {
  onToolsAvailableChange(available: boolean): void;
  onSessionStatus(status: AppHelperSessionStatus): void;
  onSessionEnded(): void;
}
