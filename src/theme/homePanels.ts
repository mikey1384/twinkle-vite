import { css } from '@emotion/css';
import { Color, mobileMaxWidth, wideBorderRadius } from '~/constants/css';

export const homePanelClass = css`
  position: relative;
  width: 100%;
  border-radius: ${wideBorderRadius};
  background: transparent;
  border: 1px solid var(--home-panel-border, ${Color.borderGray()});
  box-shadow: none;
  padding: var(--home-panel-padding, 2.2rem 2.4rem);
  display: flex;
  flex-direction: column;
  gap: var(--home-panel-gap, 2rem);
  font-size: var(--home-panel-font-size, 1.6rem);
  color: var(
    --home-panel-color,
    ${Color.darkerGray()}
  );
  backdrop-filter: none;

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
