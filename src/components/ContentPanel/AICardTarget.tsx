import React from 'react';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';
import AICardSummonContent from '~/components/AICardSummonContent';
import Icon from '~/components/Icon';
import {
  Color,
  borderRadius,
  desktopMinWidth,
  mobileMaxWidth
} from '~/constants/css';
import { useThemedCardVars } from '~/theme/hooks/useThemedCardVars';

// The card a comment was left on, tucked under the comment the same way a
// video, Build app or AI Story target is.
export default function AICardTarget({
  card,
  summonId,
  style
}: {
  card: any;
  summonId: number;
  style?: React.CSSProperties;
}) {
  const { cardVars } = useThemedCardVars({ role: 'sectionPanel' });
  return (
    <Link
      to={`/ai-card-summons/${summonId}`}
      style={{ ...cardVars, ...style }}
      className={css`
        position: relative;
        display: block;
        background: #fff;
        color: inherit;
        text-decoration: none;
        border: 1px solid var(--ui-border);
        border-radius: 0 0 ${borderRadius} ${borderRadius};
        transition:
          border-color 0.18s ease,
          background 0.18s ease;
        &:hover,
        &:focus-visible {
          color: inherit;
          text-decoration: none;
        }
        .summon-link-arrow {
          transition: transform 0.18s ease;
        }
        @media (min-width: ${desktopMinWidth}) {
          &:hover {
            border-color: var(--ui-border-strong);
            .summon-link {
              background: ${Color.logoBlue(0.07)};
            }
            .summon-link-arrow {
              transform: translateX(0.3rem);
            }
          }
        }
        @media (max-width: ${mobileMaxWidth}) {
          border-left: none;
          border-right: none;
          border-radius: 0;
        }
      `}
    >
      <div
        className={css`
          /* The block tucks 1rem under the comment panel above it. */
          padding: 2.4rem 1.6rem 1.4rem;
          @media (max-width: ${mobileMaxWidth}) {
            padding: 2.2rem 1.2rem 1.2rem;
          }
        `}
      >
        <AICardSummonContent card={card} compact />
      </div>
      <div
        className={`summon-link ${css`
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding: 1.1rem 1.6rem;
          border-top: 1px solid var(--ui-border);
          color: ${Color.logoBlue()};
          font-size: 1.3rem;
          font-weight: 700;
          transition: background 0.18s ease;
          @media (max-width: ${mobileMaxWidth}) {
            padding: 1.2rem;
          }
        `}`}
      >
        <Icon icon="comments" />
        <span style={{ flex: 1, minWidth: 0 }}>View summon discussion</span>
        <Icon className="summon-link-arrow" icon="chevron-right" />
      </div>
    </Link>
  );
}
