import React, { useRef } from 'react';
import { css, cx, keyframes } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { shouldIgnoreSuggestionTap } from './agentSuggestionsGuard';
import {
  isWelcomeTourStarter,
  startWelcomeTour
} from '~/containers/App/WelcomeTour/store';

const appear = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: none; }
`;

// A few things to ask Zero or Ciel, one tap away, above an empty message
// box. One quiet row that scrolls sideways on phones instead of wrapping.
export default function AgentSuggestions({
  ideas,
  onPick,
  loading,
  hidden
}: {
  ideas: string[];
  onPick: (idea: string) => void;
  // Faint, untappable stand-ins while the ideas are still on their way, so
  // the row already takes its final height.
  loading?: boolean;
  // Keeps the row's space but hides it and makes it untappable.
  hidden?: boolean;
}) {
  // When the row last appeared or its ideas last changed (re-appearing after
  // being hidden counts), so a tap meant for something else is not read as a
  // pick. Tracked during render so it is never later than what is on screen.
  const shownAtRef = useRef({ key: '', at: 0 });
  const showingPlaceholder = !ideas.length && !!loading;
  const stateKey = hidden
    ? 'hidden'
    : showingPlaceholder
      ? 'loading'
      : ideas.join('\n');
  if (shownAtRef.current.key !== stateKey) {
    shownAtRef.current = { key: stateKey, at: Date.now() };
  }
  if (!ideas.length && !showingPlaceholder) return null;
  const chipClass = css`
    flex-shrink: 0;
    white-space: nowrap;
    border-radius: 999px;
    border: 1px solid ${Color.logoBlue(0.28)};
    background: ${Color.logoBlue(0.06)};
    color: ${Color.darkerOceanBlue()};
    font-size: 1.35rem;
    font-weight: 600;
    padding: 0.45rem 1.05rem;
    @media (max-width: ${mobileMaxWidth}) {
      font-size: 1.3rem;
      padding: 0.4rem 0.9rem;
    }
  `;
  return (
    <div
      role={showingPlaceholder ? undefined : 'list'}
      aria-hidden={hidden || showingPlaceholder ? true : undefined}
      inert={hidden || showingPlaceholder}
      style={hidden ? { visibility: 'hidden' } : undefined}
      aria-label="Ideas to ask"
      className={css`
        display: flex;
        gap: 0.6rem;
        padding: 0.5rem 1rem 0.4rem;
        overflow-x: auto;
        scrollbar-width: none;
        -webkit-overflow-scrolling: touch;
        &::-webkit-scrollbar {
          display: none;
        }
        animation: ${appear} 0.2s ease-out;
        @media (max-width: ${mobileMaxWidth}) {
          padding: 0.4rem 0.8rem 0.3rem;
          gap: 0.5rem;
        }
      `}
    >
      {showingPlaceholder
        ? [12, 17, 14].map((width, index) => (
            <button
              key={index}
              type="button"
              disabled
              tabIndex={-1}
              className={cx(
                chipClass,
                css`
                  color: transparent;
                  opacity: 0.5;
                  pointer-events: none;
                  user-select: none;
                `
              )}
            >
              {'\u00a0'.repeat(width)}
            </button>
          ))
        : null}
      {ideas.map((idea) => (
        <button
          key={idea}
          type="button"
          role="listitem"
          onClick={(event) => {
            if (
              shouldIgnoreSuggestionTap({
                now: Date.now(),
                shownAt: shownAtRef.current.at,
                clickDetail: event.detail
              })
            ) {
              return;
            }
            // "Show me around Twinkle" opens the scripted welcome tour
            // (where they left it), not an AI-made one
            if (isWelcomeTourStarter(idea)) {
              startWelcomeTour();
              return;
            }
            onPick(idea);
          }}
          className={cx(
            chipClass,
            css`
              cursor: pointer;
              transition:
                background 0.15s ease,
                border-color 0.15s ease;
              &:hover {
                background: ${Color.logoBlue(0.13)};
                border-color: ${Color.logoBlue(0.45)};
              }
            `
          )}
        >
          {idea}
        </button>
      ))}
    </div>
  );
}

// A reply's own next-step ideas, saved in its message settings: [] when it
// has none, null when it ends on a card still waiting for an answer.
export function readAgentSuggestions(settings: unknown): string[] | null {
  let parsed: any = settings;
  if (typeof settings === 'string') {
    try {
      parsed = JSON.parse(settings);
    } catch {
      return [];
    }
  }
  const ideas = parsed?.websiteAgentSuggestions;
  const card = parsed?.websiteAgentCard;
  // A card still waiting on the user is the next step; no chips beside it.
  if (card && (!card.status || card.status === 'pending')) return null;
  return Array.isArray(ideas)
    ? ideas.filter((idea) => typeof idea === 'string' && idea).slice(0, 3)
    : [];
}
