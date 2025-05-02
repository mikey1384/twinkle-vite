import { css } from '@emotion/css';
import { mobileMaxWidth, tabletMaxWidth } from '~/constants/css';

export const container = css`
  height: CALC(100% - 1rem);
  margin-top: 1rem;
  @media (max-width: ${mobileMaxWidth}) {
    margin-top: 0;
    display: flex;
  }
`;

export const Left = css`
  position: fixed;
  left: 0;
  top: 4.5rem;
  width: 18vw;

  max-height: calc(100vh - 4.5rem);

  display: flex;
  flex-direction: column;

  min-height: 0;
  overflow-y: auto;

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
  @media (max-width: ${tabletMaxWidth}) {
    width: 51vw;
    margin-left: 20vw;
  }
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
