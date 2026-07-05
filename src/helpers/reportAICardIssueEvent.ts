import API_URL from '~/constants/URL';
import { clientVersion } from '~/constants/defaultValues';
import { getStoredItem } from '~/helpers/userDataHelpers';

interface AICardIssueEvent {
  issueType: 'filter_mismatch';
  pathname?: string;
  filters?: any;
  details?: any;
}

// One report per distinct issue signature per session, hard-capped, so a
// persistent server-side anomaly can't turn every search into a beacon.
const reportedSignatures = new Set<string>();
const MAX_REPORTS_PER_SESSION = 5;

// Fire-and-forget beacon for client-detected AI Card data anomalies (e.g. a
// filtered search response containing cards that violate the active filters).
// This must NEVER throw and NEVER block the search flow. We use fetch+keepalive
// so the request survives an unload, and carry the auth token for best-effort
// userId attribution (the endpoint treats auth as optional).
export default function reportAICardIssueEvent(event: AICardIssueEvent) {
  try {
    let signature = event.issueType;
    try {
      signature += `:${JSON.stringify(event.filters || {})}`;
    } catch {
      // Unserializable filters still dedupe by issue type alone.
    }
    if (
      reportedSignatures.has(signature) ||
      reportedSignatures.size >= MAX_REPORTS_PER_SESSION
    ) {
      return;
    }
    reportedSignatures.add(signature);

    const token = getStoredItem('token');
    const body = JSON.stringify({
      issueType: event.issueType,
      pathname: event.pathname || '',
      filters: event.filters || {},
      details: event.details || {},
      clientVersion
    });
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) headers.authorization = token;

    fetch(`${API_URL}/ai-card/issue-event`, {
      method: 'POST',
      headers,
      body,
      keepalive: true
    }).catch(() => {});
  } catch {
    // Telemetry must never affect the page.
  }
}
