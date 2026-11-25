// The bridge's `app:open-link` case (useHostBridge.ts), kept here so tests
// run the same code the bridge does (review S10).
// - A Lumine or thumbnail capture (captureScratch) answers "not opened"
//   with no sheet and no count (review S8): an automated click must never
//   make the frame inert or stall a capture.
// - The tap is read as this page sees it; a browser without the
//   user-activation API passes null (appLinkPolicy.ts, review S6).
export interface AppLinkBridgeHandlerRequest {
  target: unknown;
  userActivation: { isActive?: boolean } | null;
  isAppPreviewUrl?: (url: URL) => boolean;
}
export interface AppLinkBridgeResult {
  navigateUrl: string | null;
  response: { opened: boolean; target: 'external' | 'twinkle'; blocked?: boolean };
}

function bridgeError(message: string, code: string) {
  const error = new Error(message) as Error & { code?: string };
  error.code = code;
  return error;
}

export async function runAppLinkBridgeRequest({
  payload,
  capture,
  userActivationApi,
  handleAppLink,
  isAppPreviewUrl
}: {
  payload: any;
  capture: boolean;
  userActivationApi: { isActive?: boolean } | null | undefined;
  handleAppLink:
    | ((request: AppLinkBridgeHandlerRequest) => Promise<AppLinkBridgeResult>)
    | null
    | undefined;
  isAppPreviewUrl?: (url: URL) => boolean;
}): Promise<AppLinkBridgeResult> {
  if (capture) {
    return { navigateUrl: null, response: { opened: false, target: 'external' } };
  }
  if (!handleAppLink) {
    throw bridgeError('Links cannot be opened here.', 'LINK_UNAVAILABLE');
  }
  return handleAppLink({
    target: payload?.url,
    userActivation: userActivationApi
      ? { isActive: userActivationApi.isActive === true }
      : null,
    isAppPreviewUrl
  });
}
