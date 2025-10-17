import { css } from '@emotion/css';
import { Color, mobileMaxWidth, wideBorderRadius } from '~/constants/css';

export const themedCardBase = css`
  border-radius: ${wideBorderRadius};
  border: 1px solid var(--themed-card-border, ${Color.borderGray(0.65)});
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.98) 0%,
    var(--themed-card-bg, #f8f9ff) 100%
  );
  box-shadow: inset 0 1px 0 ${Color.white(0.85)},
    0 10px 24px rgba(15, 23, 42, 0.14);

  @media (max-width: ${mobileMaxWidth}) {
    border-radius: 0;
    border-left: none;
    border-right: none;
    box-shadow: none;
  }
`;
