import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export const panel = css`
  background: #fff;
  font-size: 1.7rem;
  padding: 1rem;
  border: 1px solid ${Color.borderGray()};
  border-radius: ${borderRadius};
  > p {
    font-size: 2rem;
    font-weight: bold;
  }
  @media (max-width: ${mobileMaxWidth}) {
    border-radius: 0;
    border-left: 0;
    border-right: 0;
  }
`;
