export type NavigationPanel = 'channels' | 'context';
export type NavigationWidths = Record<NavigationPanel, number>;

export const DEFAULT_WIDTHS: NavigationWidths = { channels: 200, context: 184 };
export const MIN_WIDTHS: NavigationWidths = { channels: 128, context: 112 };
export const MAX_WIDTHS: NavigationWidths = { channels: 360, context: 320 };
export const RESIZE_HANDLE_WIDTH = 8;
export const COMPACT_NAVIGATION_WIDTH = 180;
export const MIN_CONVERSATION_WIDTH = 360;

export function clampPanelWidth(panel: NavigationPanel, width: number) {
  return Math.round(
    Math.min(
      MAX_WIDTHS[panel],
      Math.max(MIN_WIDTHS[panel], Number.isFinite(width) ? width : DEFAULT_WIDTHS[panel])
    )
  );
}

export function readNavigationWidths(stored: string): NavigationWidths {
  try {
    const value = JSON.parse(stored);
    return {
      channels: clampPanelWidth('channels', value?.channels),
      context: clampPanelWidth('context', value?.context)
    };
  } catch {
    return { ...DEFAULT_WIDTHS };
  }
}

// Fit the rendered widths without overwriting the user's saved preference when
// rotating a tablet, zooming, or opening a chat with an extra navigation column.
export function fitNavigationWidths(
  preferred: NavigationWidths,
  availableWidth: number,
  split: boolean
): NavigationWidths {
  const channels = clampPanelWidth('channels', preferred.channels);
  const context = clampPanelWidth('context', preferred.context);
  if (!split) {
    return {
      channels: Math.min(channels, Math.max(MIN_WIDTHS.channels, availableWidth)),
      context
    };
  }
  const available = Math.max(
    MIN_WIDTHS.channels + MIN_WIDTHS.context,
    availableWidth - RESIZE_HANDLE_WIDTH
  );
  const excess = Math.max(0, channels + context - available);
  const channelRoom = channels - MIN_WIDTHS.channels;
  const contextRoom = context - MIN_WIDTHS.context;
  const totalRoom = channelRoom + contextRoom;
  const channelReduction = totalRoom
    ? Math.round(excess * channelRoom / totalRoom)
    : 0;
  return {
    channels: channels - channelReduction,
    context: context - (excess - channelReduction)
  };
}

export function getPanelMaximum(
  panel: NavigationPanel,
  widths: NavigationWidths,
  availableWidth: number,
  split: boolean
) {
  const otherWidth = split
    ? widths[panel === 'channels' ? 'context' : 'channels'] + RESIZE_HANDLE_WIDTH
    : 0;
  return Math.max(
    MIN_WIDTHS[panel],
    Math.min(MAX_WIDTHS[panel], Math.floor(availableWidth - otherWidth))
  );
}
