// Use CSS viewport width, including Windows display scaling and browser zoom.
// Below 1024px, stack the navigation lists to leave room for the conversation.
export const SPLIT_NAVIGATION_MEDIA_QUERY = '(min-width: 1024px)';

// Short viewports (phones in a browser, 768px-tall laptops) trim the controls
// block's padding. Nothing collapses behind a toggle: quick-access portraits
// stay one tap away at every height.
export const COMPACT_CONTROLS_MEDIA_QUERY = '(max-height: 700px)';
