import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore
} from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { css, keyframes } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import {
  CIEL_PFP_URL,
  ZERO_PFP_URL,
  cloudFrontURL
} from '~/constants/defaultValues';
import {
  WEBSITE_AGENT_UI_ATTRIBUTE,
  countControlsUnder,
  findWebsiteAgentElement,
  isCoveredOnScreen
} from '~/helpers/websiteAgentPage';
import AssistantDock from './AssistantDock';
import { openAssistantDock } from './AssistantDock/dockState';

export type WebsiteAgentSpotlightAction =
  'next' | 'clicked' | 'ended' | 'dismissed' | 'navigated' | 'replaced';

interface Spotlight {
  ref: string;
  assistant: 'Zero' | 'Ciel' | null;
  element: Element;
  caption: string;
  waitForUser: boolean;
  finish(action: WebsiteAgentSpotlightAction): void;
}

// One spotlight at a time, shown by the website agent bridge and drawn by the
// component below.
let current: Spotlight | null = null;
const listeners = new Set<() => void>();
function setCurrent(next: Spotlight | null) {
  current = next;
  listeners.forEach((listener) => listener());
  announceWebsiteAgentUiChange();
}

// Lets a voice call refresh what Zero or Ciel know of the screen as soon as
// their own prompt or spotlight appears or goes away.
function announceWebsiteAgentUiChange() {
  setTimeout(() => {
    window.dispatchEvent(new Event('website-agent-ui-changed'));
  }, 350);
}

// Points at the element Zero or Ciel chose (a ref from their last look at
// the page). Resolves when the user answers, or at once when the agent is
// not waiting for them.
export function showWebsiteAgentSpotlight({
  ref,
  caption,
  waitForUser,
  assistant = null
}: {
  ref: string;
  caption: string;
  waitForUser: boolean;
  assistant?: 'Zero' | 'Ciel' | null;
}): Promise<{
  shown: boolean;
  userAction?: WebsiteAgentSpotlightAction;
  error?: string;
}> {
  const element = findWebsiteAgentElement(ref);
  if (!element || !element.isConnected) {
    return Promise.resolve({
      shown: false,
      error: 'That element is no longer on the page. Read the page again.'
    });
  }
  // Centred first, so a bar fixed to the screen's edge doesn't count as
  // covering it; whatever still sits on top has to be closed.
  element.scrollIntoView({ block: 'center' });
  if (isCoveredOnScreen(element)) {
    return Promise.resolve({
      shown: false,
      error:
        'Something is on top of that (an open menu, drawer or dialog), so the user cannot see it. Close that first, then read the page again.'
    });
  }
  current?.finish('replaced');
  return new Promise((resolve) => {
    let settled = false;
    const spotlight: Spotlight = {
      ref,
      assistant,
      element,
      caption,
      waitForUser,
      finish(action) {
        if (current === spotlight) setCurrent(null);
        if (settled) return;
        settled = true;
        resolve({ shown: true, userAction: action });
      }
    };
    setCurrent(spotlight);
    if (!waitForUser) {
      settled = true;
      resolve({ shown: true });
    }
  });
}

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(65, 140, 235, 0.55); }
  70% { box-shadow: 0 0 0 14px rgba(65, 140, 235, 0); }
  100% { box-shadow: 0 0 0 0 rgba(65, 140, 235, 0); }
`;
const appear = keyframes`
  from { opacity: 0; transform: translateY(6px) scale(0.98); }
  to { opacity: 1; transform: none; }
`;

const GUTTER = 16;
const CARD_WIDTH = 320;
const SPOTLIGHT_PAD = 6;

// Where the caption card goes: next to the element (below, above, right or
// left, in that order of preference), on screen, off the element itself,
// and wherever it hides the fewest other buttons and links, so it never sits
// on the thing it tells the user to tap next.
// The four places the caption card can go next to the element, on screen:
// below, above, right, left (in that order of preference).
function cardSpots({
  rect,
  cardHeight
}: {
  rect: DOMRect;
  cardHeight: number;
}) {
  const gap = SPOTLIGHT_PAD + 12;
  const width = Math.min(CARD_WIDTH, window.innerWidth - GUTTER * 2);
  const clampTop = (top: number) =>
    Math.min(
      Math.max(GUTTER, top),
      Math.max(GUTTER, window.innerHeight - cardHeight - GUTTER)
    );
  const clampLeft = (left: number) =>
    Math.min(
      Math.max(GUTTER, left),
      Math.max(GUTTER, window.innerWidth - width - GUTTER)
    );
  const centredLeft = rect.left + rect.width / 2 - width / 2;
  const middleTop = rect.top + rect.height / 2 - cardHeight / 2;
  return {
    width,
    spots: [
      { top: rect.bottom + gap, left: centredLeft },
      { top: rect.top - gap - cardHeight, left: centredLeft },
      { top: middleTop, left: rect.right + gap },
      { top: middleTop, left: rect.left - gap - width }
    ].map(({ top, left }) => ({ top: clampTop(top), left: clampLeft(left) }))
  };
}

// Which spot, chosen once per spotlight: off the element itself and hiding
// the fewest other buttons and links, so the card never sits on the thing it
// tells the user to tap next. (Counting controls reads the whole page, so it
// never runs per frame while the page scrolls.)
function chooseCardSpot({
  rect,
  cardHeight,
  target
}: {
  rect: DOMRect;
  cardHeight: number;
  target: Element;
}) {
  const { width, spots } = cardSpots({ rect, cardHeight });
  const covers = (box: { top: number; left: number }) =>
    box.left < rect.right + SPOTLIGHT_PAD &&
    box.left + width > rect.left - SPOTLIGHT_PAD &&
    box.top < rect.bottom + SPOTLIGHT_PAD &&
    box.top + cardHeight > rect.top - SPOTLIGHT_PAD;
  let best = 0;
  let bestScore = Infinity;
  spots.forEach((box, index) => {
    if (covers(box)) return;
    const score = countControlsUnder(
      { ...box, width, height: cardHeight },
      target
    );
    if (score < bestScore) {
      best = index;
      bestScore = score;
    }
  });
  return best;
}

export default function WebsiteAgentSpotlight() {
  return (
    <>
      <SpotlightLayer />
      <PermissionPromptLayer />
      <AssistantDock />
    </>
  );
}

// Zero or Ciel are doing something on the page for a reply: their floating
// chat window comes up so the user can keep talking to them here.
export function noteWebsiteAgentWorking(assistant: 'Zero' | 'Ciel' | null) {
  if (assistant) openAssistantDock(assistant);
}

// A spotlight or permission prompt of theirs is on screen (the chat window
// steps aside meanwhile).
export function useWebsiteAgentOverlayActive() {
  const spotlight = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current
  );
  const prompt = useSyncExternalStore(
    (listener) => {
      promptListeners.add(listener);
      return () => promptListeners.delete(listener);
    },
    () => currentPrompt
  );
  return !!spotlight || !!prompt;
}

// Asking the user, on whatever page they are on, to allow a task Zero or
// Ciel described (the website agent's permission prompt).
interface PermissionPrompt {
  summary: string;
  // Longer text the answer covers (e.g. the exact plan and sharing notice
  // for Lumine), shown below the question.
  details?: string;
  assistant: 'Zero' | 'Ciel' | null;
  finish(decision: 'allow' | 'deny' | 'replaced'): void;
}
let currentPrompt: PermissionPrompt | null = null;
const promptListeners = new Set<() => void>();
function setCurrentPrompt(next: PermissionPrompt | null) {
  currentPrompt = next;
  promptListeners.forEach((listener) => listener());
  announceWebsiteAgentUiChange();
}

// The user moved on (sent a new message): whatever Zero or Ciel were
// waiting on ends now, so their reply finishes instead of holding the chat.
export function dismissWebsiteAgentPrompts() {
  currentPrompt?.finish('deny');
  current?.finish('ended');
}

export function askWebsiteAgentPermission({
  summary,
  details = '',
  assistant = null
}: {
  summary: string;
  details?: string;
  assistant?: 'Zero' | 'Ciel' | null;
}): Promise<{ decision: 'allow' | 'deny' | 'replaced' }> {
  currentPrompt?.finish('replaced');
  return new Promise((resolve) => {
    const prompt: PermissionPrompt = {
      summary,
      details: details || undefined,
      assistant,
      finish(decision) {
        if (currentPrompt === prompt) setCurrentPrompt(null);
        resolve({ decision });
      }
    };
    setCurrentPrompt(prompt);
  });
}

// Keyboard: the main button takes focus (Enter answers yes / next) and Esc
// answers no / stop, so nobody has to tab across the whole page to reply.
function useAgentKeyboard(
  container: React.RefObject<HTMLDivElement | null>,
  active: boolean,
  onEscape: () => void
) {
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;
  useEffect(() => {
    if (!active) return;
    const previous = document.activeElement as HTMLElement | null;
    container.current
      ?.querySelector<HTMLElement>('[data-agent-primary]')
      ?.focus({ preventScroll: true });
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onEscapeRef.current();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [active, container]);
}

function PermissionPromptLayer() {
  const prompt = useSyncExternalStore(
    (listener) => {
      promptListeners.add(listener);
      return () => promptListeners.delete(listener);
    },
    () => currentPrompt
  );
  const promptRef = useRef<HTMLDivElement>(null);
  useAgentKeyboard(promptRef, Boolean(prompt), () => prompt?.finish('deny'));
  if (!prompt) return null;
  return createPortal(
    <div
      ref={promptRef}
      {...{ [WEBSITE_AGENT_UI_ATTRIBUTE]: '' }}
      role="alertdialog"
      aria-live="polite"
      className={css`
        position: fixed;
        z-index: 2147483002;
        left: 50%;
        bottom: ${GUTTER * 2}px;
        @media (max-width: ${mobileMaxWidth}) {
          /* Clear of the phone's bottom navigation bar. */
          bottom: calc(7.5rem + env(safe-area-inset-bottom, 0px));
        }
        transform: translateX(-50%);
        width: min(420px, calc(100vw - ${GUTTER * 2}px));
        padding: 1.3rem 1.4rem;
        border-radius: ${borderRadius};
        background: #fff;
        color: ${Color.black()};
        border: 2px solid ${Color.logoBlue(0.25)};
        box-shadow: 0 16px 40px rgba(15, 23, 42, 0.32);
        font-size: 1.5rem;
        line-height: 1.45;
        animation: ${appear} 0.2s ease-out;
      `}
    >
      <AssistantLine assistant={prompt.assistant}>
        {renderCaption(prompt.summary)}
      </AssistantLine>
      {prompt.details ? (
        <div
          className={css`
            margin-top: 0.8rem;
            max-height: 30vh;
            overflow-y: auto;
            padding: 0.8rem 1rem;
            border-radius: ${borderRadius};
            background: ${Color.logoBlue(0.05)};
            border: 1px solid ${Color.logoBlue(0.15)};
            font-size: 1.3rem;
            line-height: 1.5;
            white-space: pre-wrap;
            color: ${Color.darkerGray()};
          `}
        >
          {prompt.details}
        </div>
      ) : null}
      <div
        className={css`
          display: flex;
          justify-content: flex-end;
          gap: 0.6rem;
          margin-top: 1rem;
        `}
      >
        <SpotlightButton
          label="No thanks"
          onClick={() => prompt.finish('deny')}
        />
        <SpotlightButton
          primary
          label="Yes, go ahead!"
          onClick={() => prompt.finish('allow')}
        />
      </div>
    </div>,
    document.body
  );
}

function SpotlightLayer() {
  const spotlight = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current
  );
  const location = useLocation();
  const [rect, setRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  // A walkthrough step waits for the user: Next is focused, Esc stops.
  useAgentKeyboard(cardRef, Boolean(spotlight?.waitForUser && rect), () =>
    spotlight?.finish('ended')
  );
  const [cardHeight, setCardHeight] = useState(120);
  // Measured after every render (the caption decides the height); the
  // equality check stops it from looping.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const height = cardRef.current?.offsetHeight;
    if (height && height !== cardHeight) setCardHeight(height);
  });

  // Moving to another page ends the spotlight on this one.
  useEffect(() => {
    return () => current?.finish('navigated');
  }, [location.pathname]);

  useLayoutEffect(() => {
    if (!spotlight) return setRect(null);
    let frame = 0;
    function track() {
      if (!spotlight!.element.isConnected) {
        // The page redrew it: follow the same element (same label, nearest
        // place) instead of dropping the step.
        const found = findWebsiteAgentElement(spotlight!.ref);
        if (!found) {
          spotlight!.finish('navigated');
          return;
        }
        spotlight!.element.removeEventListener('click', handleClick, true);
        spotlight!.element = found;
        found.addEventListener('click', handleClick, true);
      }
      const next = spotlight!.element.getBoundingClientRect();
      setRect((previous) =>
        previous &&
        previous.top === next.top &&
        previous.left === next.left &&
        previous.width === next.width &&
        previous.height === next.height
          ? previous
          : next
      );
      frame = requestAnimationFrame(track);
    }
    function handleClick() {
      spotlight!.finish('clicked');
    }
    spotlight.element.addEventListener('click', handleClick, true);
    track();
    // A spotlight nobody waits on fades after a minute.
    const timer = spotlight.waitForUser
      ? undefined
      : setTimeout(() => spotlight.finish('dismissed'), 60_000);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      spotlight.element.removeEventListener('click', handleClick, true);
    };
  }, [spotlight]);

  const rectRef = useRef<DOMRect | null>(null);
  rectRef.current = rect;
  const hasRect = Boolean(rect);
  const spotIndex = useMemo(
    () =>
      spotlight && rectRef.current
        ? chooseCardSpot({
            rect: rectRef.current,
            cardHeight,
            target: spotlight.element
          })
        : 0,
    // Chosen when a spotlight appears (or its card resizes), not per frame.
    [spotlight, cardHeight, hasRect]
  );

  if (!spotlight || !rect) return null;
  const pad = SPOTLIGHT_PAD;
  const { top: cardTop, left: cardLeft } = cardSpots({ rect, cardHeight })
    .spots[spotIndex];

  return createPortal(
    <div {...{ [WEBSITE_AGENT_UI_ATTRIBUTE]: '' }}>
      <div
        style={{
          top: rect.top - pad,
          left: rect.left - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2
        }}
        className={css`
          position: fixed;
          z-index: 2147483000;
          pointer-events: none;
          border-radius: ${borderRadius};
          border: 2px solid ${Color.logoBlue()};
          outline: 9999px solid rgba(15, 23, 42, 0.38);
          animation: ${pulse} 1.8s ease-out infinite;
          transition:
            top 0.2s ease,
            left 0.2s ease,
            width 0.2s ease,
            height 0.2s ease;
        `}
      />
      <div
        ref={cardRef}
        role="dialog"
        aria-live="polite"
        style={{ left: cardLeft, top: cardTop }}
        className={css`
          position: fixed;
          z-index: 2147483001;
          width: min(${CARD_WIDTH}px, calc(100vw - ${GUTTER * 2}px));
          padding: 1.1rem 1.2rem;
          border-radius: ${borderRadius};
          background: #fff;
          color: ${Color.black()};
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.28);
          font-size: 1.5rem;
          line-height: 1.45;
          animation: ${appear} 0.2s ease-out;
        `}
      >
        <AssistantLine assistant={spotlight.assistant}>
          {renderCaption(spotlight.caption)}
        </AssistantLine>
        <div
          className={css`
            display: flex;
            justify-content: flex-end;
            gap: 0.6rem;
            margin-top: 0.9rem;
          `}
        >
          {spotlight.waitForUser ? (
            <>
              <SpotlightButton
                label="Stop"
                onClick={() => spotlight.finish('ended')}
              />
              <SpotlightButton
                primary
                label="Next"
                onClick={() => spotlight.finish('next')}
              />
            </>
          ) : (
            <SpotlightButton
              primary
              label="Got it"
              onClick={() => spotlight.finish('dismissed')}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// The assistant speaking: their picture and name beside what they say, so a
// prompt reads as a friend asking rather than a system warning.
function AssistantLine({
  assistant,
  children
}: {
  assistant: 'Zero' | 'Ciel' | null;
  children: React.ReactNode;
}) {
  return (
    <div
      className={css`
        display: flex;
        gap: 0.8rem;
        align-items: flex-start;
      `}
    >
      <AssistantPicture assistant={assistant} size="3.4rem" />
      <div>
        {assistant ? (
          <div
            className={css`
              font-weight: 800;
              font-size: 1.3rem;
              color: ${Color.logoBlue()};
            `}
          >
            {assistant}
          </div>
        ) : null}
        <div>{children}</div>
      </div>
    </div>
  );
}

function AssistantPicture({
  assistant,
  size
}: {
  assistant: 'Zero' | 'Ciel' | null;
  size: string;
}) {
  const storedPicture =
    assistant === 'Ciel'
      ? CIEL_PFP_URL
      : assistant === 'Zero'
        ? ZERO_PFP_URL
        : '';
  // Stored as a path on the image CDN, like other profile pictures.
  const picture =
    storedPicture && storedPicture.startsWith('/')
      ? `${cloudFrontURL}${storedPicture}`
      : storedPicture;
  if (!picture) return null;
  return (
    <img
      src={picture}
      alt=""
      onError={(event) => {
        event.currentTarget.style.display = 'none';
      }}
      className={css`
        width: ${size};
        height: ${size};
        border-radius: 50%;
        flex-shrink: 0;
      `}
    />
  );
}

// Captions are plain sentences; **bold** is the one emphasis kept.
function renderCaption(caption: string) {
  return caption
    .split(/\*\*(.+?)\*\*/g)
    .map((part, index) =>
      index % 2 === 1 ? <strong key={index}>{part}</strong> : part
    );
}

function SpotlightButton({
  label,
  primary,
  onClick
}: {
  label: string;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...(primary ? { 'data-agent-primary': '' } : {})}
      className={css`
        border-radius: 999px;
        padding: 0.5rem 1.1rem;
        font-size: 1.35rem;
        font-weight: 700;
        cursor: pointer;
        border: 1px solid ${primary ? Color.logoBlue() : Color.lighterGray()};
        background: ${primary ? Color.logoBlue() : '#fff'};
        color: ${primary ? '#fff' : Color.darkerGray()};
        transition: filter 0.15s ease;
        &:hover {
          filter: brightness(0.95);
        }
      `}
    >
      {label}
    </button>
  );
}
