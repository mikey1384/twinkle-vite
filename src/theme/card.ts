import { css } from '@emotion/css';
import { mobileMaxWidth, borderRadius } from '~/constants/css';

export const themedCardBase = css`
  border: 1px solid var(--themed-card-border, transparent);
  border-radius: ${borderRadius};
  transition: border-color 0.18s ease;

  @media (max-width: ${mobileMaxWidth}) {
    border-left: none;
    border-right: none;
    border-radius: 0;
  }
`;
