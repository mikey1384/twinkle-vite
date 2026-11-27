export interface CardWindowSize {
  height: number;
  width: number;
}

export interface CardWindowMeasurement {
  key: string;
  size?: CardWindowSize;
}

export type CardWindowOuterResizeAction =
  | { type: 'noop' }
  | { type: 'clear' }
  | { type: 'update'; size: CardWindowSize };

export interface CardWindowMeasurementControllerOptions {
  cacheLimit: number;
  sizes: Map<string, CardWindowSize>;
  onUpdate: (cacheKey: string, next: CardWindowSize) => void;
  onClear: (cacheKey: string) => void;
}

export function resolveCardWindowMeasuredWidth(
  outerWidth: number,
  panelWidth: number
) {
  return outerWidth > 0 ? outerWidth : panelWidth;
}

export function shouldInvalidateCardWindowMeasurement(
  previous: CardWindowSize | undefined,
  outerWidth: number
) {
  return (
    outerWidth > 0 &&
    Boolean(previous) &&
    Math.abs((previous?.width || 0) - outerWidth) > 1
  );
}

export function resolveCardWindowOuterResize(
  previous: CardWindowSize | undefined,
  outerWidth: number,
  panelMounted: boolean
): CardWindowOuterResizeAction {
  if (
    !shouldInvalidateCardWindowMeasurement(previous, outerWidth) ||
    !previous
  ) {
    return { type: 'noop' };
  }
  if (panelMounted) {
    return {
      type: 'update',
      size: {
        height: previous.height,
        width: outerWidth
      }
    };
  }
  return { type: 'clear' };
}

export function getClearedCardMeasurementState(
  prev: CardWindowMeasurement,
  cacheKey: string
): CardWindowMeasurement {
  if (prev.key === cacheKey && prev.size === undefined) {
    return prev;
  }
  return { key: cacheKey };
}

export function getNextCardMeasurementState(
  prev: CardWindowMeasurement,
  cacheKey: string,
  next: CardWindowSize
): CardWindowMeasurement {
  if (
    prev.key === cacheKey &&
    prev.size?.height === next.height &&
    prev.size?.width === next.width
  ) {
    return prev;
  }
  return { key: cacheKey, size: next };
}

export function createCardWindowMeasurementController({
  cacheLimit,
  sizes,
  onUpdate,
  onClear
}: CardWindowMeasurementControllerOptions) {
  let latestSize: CardWindowSize | undefined;
  let outerWidth = 0;

  function recordSize(cacheKey: string, next: CardWindowSize) {
    if (latestSize?.height === next.height && latestSize.width === next.width) {
      return;
    }
    latestSize = next;
    sizes.delete(cacheKey);
    sizes.set(cacheKey, next);
    if (sizes.size > cacheLimit) {
      const oldestKey = sizes.keys().next().value;
      if (oldestKey !== undefined) sizes.delete(oldestKey);
    }
    onUpdate(cacheKey, next);
  }

  return {
    syncLatestSize(size: CardWindowSize | undefined) {
      latestSize = size;
    },
    resetOuterWidth() {
      outerWidth = 0;
    },
    observePanelResize(
      cacheKey: string,
      panelHeight: number,
      panelWidth: number
    ) {
      // Record height from the inner panel alongside the outer wrapper's width
      // so width comparisons stay in one coordinate space and never ping-pong
      // if inner/outer widths differ by padding, border, or subpixel rounding.
      const next: CardWindowSize = {
        height: Math.ceil(panelHeight),
        width: resolveCardWindowMeasuredWidth(outerWidth, panelWidth)
      };
      if (next.height <= 0 || next.width <= 0) return;
      recordSize(cacheKey, next);
    },
    observeOuterResize(
      cacheKey: string,
      width: number,
      panelMounted: boolean
    ) {
      if (width > 0) {
        outerWidth = width;
      }
      // A hidden page reports zero; retain its last usable measurement.
      // When the inner panel is still mounted, re-anchor the cached width in
      // place instead of clearing height (panelRef may fire before or without
      // another entry when ResizeObserver observes child before parent).
      const action = resolveCardWindowOuterResize(
        latestSize,
        width,
        panelMounted
      );
      if (action.type === 'noop') return;
      if (action.type === 'update') {
        recordSize(cacheKey, action.size);
        return;
      }
      sizes.delete(cacheKey);
      latestSize = undefined;
      onClear(cacheKey);
    }
  };
}
