import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

// Keep RichText's overflow measurements in sync with the visible text.
export const CHAT_TEXT_LINE_HEIGHT = 1.625;

export const chatTextClass = css`
  font-family: 'Inter', 'Segoe UI', Helvetica, Arial, sans-serif;
  font-size: max(17px, 1.7rem);
  font-weight: 400;
  line-height: ${CHAT_TEXT_LINE_HEIGHT};
  color: #273449;
  @media (max-width: ${mobileMaxWidth}) {
    /* The legacy app root is 8px on phones. Keep chat readable without
       changing rem-based spacing throughout the rest of the application. */
    font-size: max(16px, 1.6rem);
  }
`;

export const chatAuthorClass = css`
  font-size: max(14px, 1.5rem);
  font-weight: 600;
  line-height: 1.5;
  color: #334155;
`;

export const chatTimestampClass = css`
  font-size: max(11px, 1.1rem);
  font-weight: 400;
  line-height: 1.5;
  font-variant-numeric: tabular-nums;
  color: #64748b;
`;

export const chatCompactTimestampClass = css`
  display: block;
  padding-top: 0.8rem;
  text-align: center;
  font-size: max(10px, 1.05rem);
  line-height: 1.4;
  font-variant-numeric: tabular-nums;
  color: #64748b;
`;
