import React from 'react';
import { css, keyframes } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

const appear = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: none; }
`;

// A few things to ask Zero or Ciel, one tap away, above an empty message
// box. One quiet row that scrolls sideways on phones instead of wrapping.
export default function AgentSuggestions({
  ideas,
  onPick
}: {
  ideas: string[];
  onPick: (idea: string) => void;
}) {
  if (!ideas.length) return null;
  return (
    <div
      role="list"
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
      {ideas.map((idea) => (
        <button
          key={idea}
          type="button"
          role="listitem"
          onClick={() => onPick(idea)}
          className={css`
            flex-shrink: 0;
            white-space: nowrap;
            border-radius: 999px;
            border: 1px solid ${Color.logoBlue(0.28)};
            background: ${Color.logoBlue(0.06)};
            color: ${Color.darkerOceanBlue()};
            font-size: 1.35rem;
            font-weight: 600;
            padding: 0.45rem 1.05rem;
            cursor: pointer;
            transition:
              background 0.15s ease,
              border-color 0.15s ease;
            &:hover {
              background: ${Color.logoBlue(0.13)};
              border-color: ${Color.logoBlue(0.45)};
            }
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.3rem;
              padding: 0.4rem 0.9rem;
            }
          `}
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
