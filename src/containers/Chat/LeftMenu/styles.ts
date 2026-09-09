import { css } from '@emotion/css';
import { COMPACT_NAVIGATION_WIDTH } from './helpers/navigationSizing';

export const contextGroupClass = css`
  @media (max-width: 1023px) {
    &, &:not(:last-child) {
      flex: 0 0 auto;
      min-height: 0;
      max-height: none;
      overflow: visible;
    }
  }
  @container chat-context (max-width: ${COMPACT_NAVIGATION_WIDTH}px) {
    margin-inline: 0.4rem;
    width: calc(100% - 0.8rem);
    border: 0;
    padding: 0;
  }
`;

export const contextRowClass = css`
  display: flex;
  align-items: center;
  gap: 1rem;
  > svg { flex-shrink: 0; }
  .chat-context-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  @container chat-context (max-width: ${COMPACT_NAVIGATION_WIDTH}px) {
    gap: 0.5rem;
    padding: 0.8rem 0.4rem;
    .chat-context-label {
      font-size: max(13px, 1.3rem);
      line-height: 1.35;
      white-space: normal;
      overflow-wrap: anywhere;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }
  }
  @media (pointer: coarse) {
    min-height: 44px;
  }
`;
