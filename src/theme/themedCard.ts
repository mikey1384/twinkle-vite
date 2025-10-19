import { css } from '@emotion/css';
import { Color, mobileMaxWidth, wideBorderRadius } from '~/constants/css';

export const themedCardBase = css`
  border-radius: ${wideBorderRadius};
  border: 1px solid var(--themed-card-border, ${Color.borderGray(0.6)});

  @media (max-width: ${mobileMaxWidth}) {
    border-radius: 0;
    border-left: none;
    border-right: none;
    box-shadow: none;
  }
`;
