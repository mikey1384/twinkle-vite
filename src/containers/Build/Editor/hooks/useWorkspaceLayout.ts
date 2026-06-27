import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent
} from 'react';
import { mobileMaxWidth } from '~/constants/css';
import { getStoredItem, setStoredItem } from '~/helpers/userDataHelpers';
import {
  BUILD_WORKSPACE_RESIZE_HANDLE_WIDTH,
  DEFAULT_BUILD_CHAT_PANEL_WIDTH,
  MAX_BUILD_CHAT_PANEL_WIDTH,
  MIN_BUILD_CHAT_PANEL_WIDTH,
  MIN_BUILD_PREVIEW_PANEL_WIDTH
} from '../constants';

const BUILD_CHAT_PANEL_WIDTH_STORAGE_KEY =
  'twinkle:build-workshop-chat-panel-width';

function clampBuildChatPanelWidth(width: number, workspaceWidth = 0) {
  const safeWidth = Number.isFinite(width)
    ? width
    : DEFAULT_BUILD_CHAT_PANEL_WIDTH;
  const maxWidthFromWorkspace =
    workspaceWidth > 0
      ? workspaceWidth -
        MIN_BUILD_PREVIEW_PANEL_WIDTH -
        BUILD_WORKSPACE_RESIZE_HANDLE_WIDTH
      : MAX_BUILD_CHAT_PANEL_WIDTH;
  const maxWidth = Math.max(
    MIN_BUILD_CHAT_PANEL_WIDTH,
    Math.min(MAX_BUILD_CHAT_PANEL_WIDTH, maxWidthFromWorkspace)
  );
  return Math.round(
    Math.min(maxWidth, Math.max(MIN_BUILD_CHAT_PANEL_WIDTH, safeWidth))
  );
}

function readInitialBuildChatPanelWidth() {
  if (typeof window === 'undefined') return DEFAULT_BUILD_CHAT_PANEL_WIDTH;
  try {
    const storedValue = getStoredItem(BUILD_CHAT_PANEL_WIDTH_STORAGE_KEY);
    if (!storedValue) return DEFAULT_BUILD_CHAT_PANEL_WIDTH;
    const storedWidth = Number(storedValue);
    if (!Number.isFinite(storedWidth) || storedWidth <= 0) {
      return DEFAULT_BUILD_CHAT_PANEL_WIDTH;
    }
    return clampBuildChatPanelWidth(storedWidth);
  } catch {
    return DEFAULT_BUILD_CHAT_PANEL_WIDTH;
  }
}

function persistBuildChatPanelWidth(width: number) {
  if (typeof window === 'undefined') return;
  try {
    setStoredItem(
      BUILD_CHAT_PANEL_WIDTH_STORAGE_KEY,
      String(clampBuildChatPanelWidth(width))
    );
  } catch {
    // The resize still works for the current session when storage is blocked.
  }
}

function getBuildWorkshopScale(chatPanelWidth: number) {
  return Math.max(
    0.96,
    Math.min(
      1.25,
      1 + (chatPanelWidth - DEFAULT_BUILD_CHAT_PANEL_WIDTH) / 900
    )
  );
}

function getIsDesktopBuildWorkspaceLayout() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return true;
  }
  return !window.matchMedia(`(max-width: ${mobileMaxWidth})`).matches;
}

export default function useWorkspaceLayout({
  communicationPanelShown
}: {
  communicationPanelShown: boolean;
}) {
  const [buildChatPanelWidth, setBuildChatPanelWidth] = useState(
    readInitialBuildChatPanelWidth
  );
  const [isDesktopWorkspaceLayout, setIsDesktopWorkspaceLayout] = useState(
    getIsDesktopBuildWorkspaceLayout
  );
  const workspaceShellRef = useRef<HTMLDivElement>(null);
  const workspaceResizeCleanupRef = useRef<(() => void) | null>(null);
  const buildWorkshopScale = isDesktopWorkspaceLayout
    ? getBuildWorkshopScale(buildChatPanelWidth)
    : 1;
  const workspaceShellStyle = communicationPanelShown
    ? ({
        '--build-chat-panel-width': `${buildChatPanelWidth}px`
      } as CSSProperties)
    : undefined;

  useEffect(() => {
    function handleWindowResize() {
      const isDesktopLayout = getIsDesktopBuildWorkspaceLayout();
      setIsDesktopWorkspaceLayout(isDesktopLayout);
      if (!isDesktopLayout) return;
      const workspaceWidth =
        workspaceShellRef.current?.getBoundingClientRect().width || 0;
      setBuildChatPanelWidth((currentWidth) =>
        clampBuildChatPanelWidth(currentWidth, workspaceWidth)
      );
    }

    handleWindowResize();
    window.addEventListener('resize', handleWindowResize);
    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  useEffect(() => {
    return () => {
      workspaceResizeCleanupRef.current?.();
      workspaceResizeCleanupRef.current = null;
    };
  }, []);

  function handleWorkspaceResizePointerDown(
    event: ReactPointerEvent<HTMLButtonElement>
  ) {
    if (!isDesktopWorkspaceLayout) return;
    if (event.button !== 0) return;
    event.preventDefault();
    workspaceResizeCleanupRef.current?.();

    const handleElement = event.currentTarget;
    const pointerId = event.pointerId;
    const workspaceWidth =
      workspaceShellRef.current?.getBoundingClientRect().width || 0;
    const startX = event.clientX;
    const startWidth = buildChatPanelWidth;
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    let latestWidth = clampBuildChatPanelWidth(startWidth, workspaceWidth);

    try {
      handleElement.setPointerCapture(pointerId);
    } catch {
      // Pointer capture is best effort; window listeners still handle normal drags.
    }

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    function cleanup() {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', cleanup);
      window.removeEventListener('pointercancel', cleanup);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      try {
        handleElement.releasePointerCapture(pointerId);
      } catch {
        // Pointer capture release is best effort.
      }
      persistBuildChatPanelWidth(latestWidth);
      workspaceResizeCleanupRef.current = null;
    }

    function handlePointerMove(moveEvent: PointerEvent) {
      moveEvent.preventDefault();
      latestWidth = clampBuildChatPanelWidth(
        startWidth + moveEvent.clientX - startX,
        workspaceWidth
      );
      setBuildChatPanelWidth(latestWidth);
    }

    workspaceResizeCleanupRef.current = cleanup;
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', cleanup);
    window.addEventListener('pointercancel', cleanup);
  }

  function handleWorkspaceResizeKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>
  ) {
    if (!isDesktopWorkspaceLayout) return;
    const step = event.shiftKey ? 64 : 24;
    const workspaceWidth =
      workspaceShellRef.current?.getBoundingClientRect().width || 0;
    let nextWidth: number | null = null;

    if (event.key === 'ArrowLeft') {
      nextWidth = buildChatPanelWidth - step;
    } else if (event.key === 'ArrowRight') {
      nextWidth = buildChatPanelWidth + step;
    } else if (event.key === 'Home') {
      nextWidth = MIN_BUILD_CHAT_PANEL_WIDTH;
    } else if (event.key === 'End') {
      nextWidth = MAX_BUILD_CHAT_PANEL_WIDTH;
    }

    if (nextWidth === null) return;
    event.preventDefault();
    const clampedWidth = clampBuildChatPanelWidth(nextWidth, workspaceWidth);
    setBuildChatPanelWidth(clampedWidth);
    persistBuildChatPanelWidth(clampedWidth);
  }

  return {
    buildChatPanelWidth,
    buildWorkshopScale,
    handleWorkspaceResizeKeyDown,
    handleWorkspaceResizePointerDown,
    isDesktopWorkspaceLayout,
    workspaceShellRef,
    workspaceShellStyle
  };
}
