import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

export const container = css`
  height: 100%;
  margin-top: 1rem;
  @media (max-width: ${mobileMaxWidth}) {
    margin-top: 0;
    display: flex;
  }
`;

export const Left = css`
  width: 18vw;
  left: 0;
  display: block;
  position: fixed;
  @media (max-width: ${mobileMaxWidth}) {
    display: none;
  }
  @media (min-width: 2304px) {
    width: 14vw;
    left: 12vw;
  }
`;

export const Center = css`
  display: flex;
  justify-content: center;
  width: 45vw;
  height: 100%;
  margin-left: 23vw;
  @media (max-width: ${mobileMaxWidth}) {
    width: 100%;
    margin-left: 0;
  }
`;

export const Right = css`
  width: CALC(27vw - 1rem);
  right: 1rem;
  overflow-y: scroll;
  -webkit-overflow-scrolling: touch;
  top: 4.5rem;
  max-height: CALC(100% - 4.5rem);
  position: fixed;
  @media (max-width: ${mobileMaxWidth}) {
    display: none;
  }
  @media (min-width: 2304px) {
    width: 20vw;
    right: 15vw;
  }
`;
