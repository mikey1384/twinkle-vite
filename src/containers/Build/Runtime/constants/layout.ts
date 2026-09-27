// Set on the runtime shell while a phone held sideways plays the app full
// screen (usePhoneLandscape, never for embedded previews). Child styles key off
// this attribute rather than the raw media query, because inside an embedded
// feed iframe the media query reads the small iframe box.
export const LANDSCAPE_FULLSCREEN_ATTR = 'data-landscape-fullscreen';
export const LANDSCAPE_FULLSCREEN_SELECTOR = `[${LANDSCAPE_FULLSCREEN_ATTR}='true']`;
