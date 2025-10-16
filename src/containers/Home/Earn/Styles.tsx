import {
  Color,
  mobileMaxWidth,
  wideBorderRadius
} from '~/constants/css';
import { css } from '@emotion/css';

export const panel = css`
  position: relative;
  width: 100%;
  border-radius: ${wideBorderRadius};
  background: linear-gradient(
    145deg,
    var(--earn-panel-bg, #ffffff) 0%,
    rgba(255, 255, 255, 0.98) 38%,
    var(--earn-panel-tint, rgba(232, 240, 255, 0.65)) 100%
  );
  border: 1px solid var(--earn-panel-border, ${Color.borderGray()});
  box-shadow:
    0 24px 42px -32px rgba(15, 23, 42, 0.28),
    0 1px 3px rgba(15, 23, 42, 0.12);
  padding: 2.2rem 2.4rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  font-size: 1.6rem;
  color: ${Color.darkerGray()};
  backdrop-filter: blur(6px);
  > p,
  > h2 {
    font-size: 2.1rem;
    font-weight: 700;
    color: var(--earn-panel-heading, ${Color.darkerGray()});
    margin: 0;
  }
  @media (max-width: ${mobileMaxWidth}) {
    border-radius: 0;
    border-left: 0;
    border-right: 0;
    box-shadow: none;
    padding: 1.8rem 1.4rem;
  }
`;
