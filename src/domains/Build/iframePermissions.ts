export const BUILD_APP_IFRAME_ALLOW =
  'accelerometer; autoplay; camera; clipboard-write; display-capture; encrypted-media; fullscreen; gamepad; geolocation; gyroscope; magnetometer; microphone; midi; picture-in-picture; screen-wake-lock; web-share; xr-spatial-tracking';

export const BUILD_APP_PREVIEW_IFRAME_SANDBOX =
  'allow-scripts allow-downloads allow-pointer-lock';

export const BUILD_APP_RUNTIME_IFRAME_SANDBOX =
  `${BUILD_APP_PREVIEW_IFRAME_SANDBOX} allow-same-origin`;
