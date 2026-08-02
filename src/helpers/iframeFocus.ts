interface IframeFocusControllerOptions {
  cancelScheduledCheck: (checkId: number) => void;
  documentHasFocus: () => boolean;
  getActiveElement: () => unknown;
  getOwnedFrames: () => readonly unknown[];
  restoreWindowFocus: () => void;
  scheduleCheck: (callback: () => void) => number;
}

export interface IframeFocusController {
  dispose: () => void;
  handleWindowBlur: () => void;
}

// Browsers fire a blur event on the host window when focus moves into an
// iframe, even though the top-level tab remains focused. GA4 treats that blur
// as the end of web engagement. Defer the decision until the browser has
// installed the iframe as document.activeElement, then restore the semantic
// window-focus signal only for one of this host's own frames.
export function createIframeFocusController({
  cancelScheduledCheck,
  documentHasFocus,
  getActiveElement,
  getOwnedFrames,
  restoreWindowFocus,
  scheduleCheck
}: IframeFocusControllerOptions): IframeFocusController {
  let disposed = false;
  let scheduledCheckId: number | null = null;

  function handleWindowBlur() {
    if (scheduledCheckId !== null) {
      cancelScheduledCheck(scheduledCheckId);
    }
    scheduledCheckId = scheduleCheck(() => {
      scheduledCheckId = null;
      if (disposed || !documentHasFocus()) return;

      const activeElement = getActiveElement();
      if (!activeElement) return;
      const activeOwnedFrame = getOwnedFrames().some(
        (frame) => frame && frame === activeElement
      );
      if (!activeOwnedFrame) return;

      restoreWindowFocus();
    });
  }

  function dispose() {
    disposed = true;
    if (scheduledCheckId !== null) {
      cancelScheduledCheck(scheduledCheckId);
      scheduledCheckId = null;
    }
  }

  return {
    dispose,
    handleWindowBlur
  };
}
