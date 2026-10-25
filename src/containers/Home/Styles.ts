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
  top: 4.5rem;
  left: var(--ui-frame-x);
  width: calc(var(--ui-frame) * 0.18);

  height: calc(100vh - 4.5rem);
  height: calc(100dvh - 4.5rem);
  max-height: calc(100vh - 4.5rem);
  max-height: calc(100dvh - 4.5rem);

  display: flex;
  flex-direction: column;

  min-height: 0;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  scroll-padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 7rem);

  @media (max-width: ${mobileMaxWidth}) {
    display: none;
  }
`;

export const Center = css`
  display: flex;
  justify-content: center;
  width: calc(var(--ui-frame) * 0.45);
  height: 100%;
  margin-left: calc(var(--ui-frame-x) + var(--ui-frame) * 0.23);
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
  width: calc(var(--ui-frame) * 0.27 - 1rem);
  right: calc(var(--ui-frame-x) + 1rem);
  overflow-y: scroll;
  -webkit-overflow-scrolling: touch;
  top: 4.5rem;
  max-height: CALC(100% - 4.5rem);
  position: fixed;
  @media (max-width: ${mobileMaxWidth}) {
    display: none;
  }
`;
