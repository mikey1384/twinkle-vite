import { css } from '@emotion/css';
import { mobileMaxWidth, wideBorderRadius } from '~/constants/css';

export const themedCardBase = css`
  border: 1px solid var(--ui-border);
  border-radius: ${wideBorderRadius};

  @media (max-width: ${mobileMaxWidth}) {
    border-left: none;
    border-right: none;
    border-radius: 0;
  }
`;
