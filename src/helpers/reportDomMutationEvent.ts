import API_URL from '~/constants/URL';
import { clientVersion } from '~/constants/defaultValues';
import { getStoredItem } from '~/helpers/userDataHelpers';

export type DomMutationGuardMethod = 'removeChild' | 'insertBefore' | 'recover';

interface DomMutationEvent {
  method: DomMutationGuardMethod;
  // Coarse origin: pathname for raw guard fires, componentPath for boundary
  // recoveries. Both are sent when available.
  surface?: string;
  pathname?: string;
  componentPath?: string;
  recovered?: boolean;
}

// Fire-and-forget beacon for the DOM mutation guard / ErrorBoundary backstop.
// This must NEVER throw and NEVER block: it runs from inside a patched
// Node.prototype method and from React's error path, so any failure here would
// be far worse than the missing telemetry. We use fetch+keepalive so the request
// survives an unload, and carry the auth token for best-effort userId
// attribution (the endpoint treats auth as optional).
export default function reportDomMutationEvent(event: DomMutationEvent) {
  try {
    const token = getStoredItem('token');
    const body = JSON.stringify({
      method: event.method,
      surface: event.surface || '',
      pathname: event.pathname || '',
      componentPath: event.componentPath || '',
      recovered: !!event.recovered,
      clientVersion
    });
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) headers.authorization = token;

    fetch(`${API_URL}/user/dom-mutation-event`, {
      method: 'POST',
      headers,
      body,
      keepalive: true
    }).catch(() => {});
  } catch {
    // Telemetry must never affect the page.
  }
}
