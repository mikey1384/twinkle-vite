import { css } from '@emotion/css';
import { Color, mobileMaxWidth, wideBorderRadius } from '~/constants/css';

export const homePanelClass = css`
  position: relative;
  width: 100%;
  border-radius: ${wideBorderRadius};
  background: linear-gradient(
    145deg,
    var(--home-panel-bg, #ffffff) 0%,
    rgba(255, 255, 255, 0.96) 50%,
    var(--home-panel-tint, rgba(232, 240, 255, 0.28)) 100%
  );
  border: 1px solid var(--home-panel-border, ${Color.borderGray()});
  box-shadow:
    0 24px 42px -32px rgba(15, 23, 42, 0.28),
    0 1px 3px rgba(15, 23, 42, 0.12);
  padding: var(--home-panel-padding, 2.2rem 2.4rem);
  display: flex;
  flex-direction: column;
  gap: var(--home-panel-gap, 2rem);
  font-size: var(--home-panel-font-size, 1.6rem);
  color: var(
    --home-panel-color,
    ${Color.darkerGray()}
  );
  backdrop-filter: blur(6px);

  > :where(p, h2) {
    font-size: var(--home-panel-heading-size, 2.1rem);
    font-weight: 700;
    color: var(--home-panel-heading, ${Color.darkerGray()});
    margin: 0;
  }

  @media (max-width: ${mobileMaxWidth}) {
    border-radius: 0;
    border-left: none;
    border-right: none;
    box-shadow: none;
    padding: var(--home-panel-mobile-padding, 1.8rem 1.4rem);
  }
`;
