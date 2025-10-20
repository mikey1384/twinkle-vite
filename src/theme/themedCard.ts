import { css } from '@emotion/css';
import { mobileMaxWidth, wideBorderRadius } from '~/constants/css';

export const themedCardBase = css`
  border-radius: ${wideBorderRadius};
  border: 1px solid var(--themed-card-border, var(--ui-border));

  @media (max-width: ${mobileMaxWidth}) {
    border-radius: 0;
    border-left: none;
    border-right: none;
    box-shadow: none;
  }
`;
