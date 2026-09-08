interface Bounds {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function positionReactionPicker(
  anchor: Bounds,
  bounds: Bounds,
  size: { width: number; height: number }
) {
  const edge = 4;
  const topEdge = bounds.top + edge;
  const bottomEdge = bounds.bottom - edge;
  const leftEdge = bounds.left + edge;
  const rightEdge = bounds.right - edge;
  const maxHeight = Math.max(0, bottomEdge - topEdge);
  const height = Math.min(size.height, maxHeight);
  const above = anchor.bottom + height > bottomEdge;
  const top = Math.max(
    topEdge,
    Math.min(above ? anchor.top - height : anchor.bottom, bottomEdge - height)
  );
  const left = Math.max(
    leftEdge,
    Math.min(anchor.right - size.width, rightEdge - size.width)
  );
  return {
    top: top - anchor.top,
    left: left - anchor.left,
    maxHeight: Math.max(0, maxHeight - 6),
    above
  };
}

export function getReactionPickerBounds(element: HTMLElement): Bounds {
  const bounds = {
    top: 0,
    left: 0,
    right: document.documentElement.clientWidth,
    bottom: document.documentElement.clientHeight
  };
  // An inline popup keeps the native tab order. Fit it inside every clipping
  // ancestor, including the message scroller and a surrounding chat dialog.
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    const style = getComputedStyle(parent);
    const clipsX = /auto|scroll|hidden|clip/.test(style.overflowX);
    const clipsY = /auto|scroll|hidden|clip/.test(style.overflowY);
    if (!clipsX && !clipsY) continue;
    const rect = parent.getBoundingClientRect();
    if (clipsX) {
      bounds.left = Math.max(bounds.left, rect.left + parent.clientLeft);
      bounds.right = Math.min(
        bounds.right,
        rect.left + parent.clientLeft + parent.clientWidth
      );
    }
    if (clipsY) {
      bounds.top = Math.max(bounds.top, rect.top + parent.clientTop);
      bounds.bottom = Math.min(
        bounds.bottom,
        rect.top + parent.clientTop + parent.clientHeight
      );
    }
  }
  return bounds;
}
