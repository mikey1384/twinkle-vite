import { mobileMaxWidth } from '~/constants/css';

export const DEFAULT_BUILD_CHAT_PANEL_WIDTH = 380;
export const MIN_BUILD_CHAT_PANEL_WIDTH = 320;
export const MAX_BUILD_CHAT_PANEL_WIDTH = 720;
export const MIN_BUILD_PREVIEW_PANEL_WIDTH = 360;
export const BUILD_WORKSPACE_RESIZE_HANDLE_WIDTH = 12;
export const BUILD_WORKSPACE_COMPACT_LANDSCAPE_MAX_HEIGHT = 520;
export const BUILD_WORKSPACE_COMPACT_LANDSCAPE_MEDIA_QUERY = `(orientation: landscape) and (max-height: ${BUILD_WORKSPACE_COMPACT_LANDSCAPE_MAX_HEIGHT}px) and (hover: none) and (pointer: coarse)`;
export const BUILD_WORKSPACE_COMPACT_MEDIA_QUERY = `(max-width: ${mobileMaxWidth}), ${BUILD_WORKSPACE_COMPACT_LANDSCAPE_MEDIA_QUERY}`;
