import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import TwinkleLogo from './twinkle-logo.png';

export const container = css`
  position: relative;
  padding: 1.5rem 0;
  text-align: center;
  border-radius: ${borderRadius};
  border: 1px solid ${Color.borderGray()};
  z-index: 0;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url(${TwinkleLogo}) center center;
    background-size: auto 100%;
    background-position-x: 15%;
    opacity: 0.2;
    z-index: -1;
  }

  @media (max-width: ${mobileMaxWidth}) {
    border-radius: 0;
    border-left: 0;
    border-right: 0;
    &::after {
      background-position-x: 5%;
    }
  }
`;
