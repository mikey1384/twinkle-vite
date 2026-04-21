import { css } from '@emotion/css';
import { Color, tabletMaxWidth, borderRadius } from '~/constants/css';
import { themedCardBase } from '~/theme/themedCard';

export const chatLabel = 'Chat';
export const changePicLabel = 'Change Pic';
export const editBioLabel = 'Edit Bio';
export const imageTooLarge10MBLabel = 'Image is too large (limit: 10mb)';
export const lastOnlineLabel = 'Last online';
export const pleaseSelectSmallerImageLabel =
  'Please select a smaller image';
export const profileLabel = 'Profile';
export const cardsLabel = 'Cards';

export const quickLinkThemes = {
  aiCards: {
    background: 'rgba(152, 28, 235, 0.08)',
    text: Color.darkBluerGray(),
    icon: Color.purple(),
    fillBg: Color.purple(0.92),
    fillFg: '#fff',
    fillIcon: '#fff',
    fillBorder: 'rgba(152, 28, 235, 0.45)',
    border: 'rgba(152, 28, 235, 0.18)',
    shadow: `0 8px 18px -16px ${Color.purple(0.28)}`
  },
  website: {
    background: 'rgba(40, 182, 44, 0.08)',
    text: Color.darkBlueGray(),
    icon: Color.green(),
    fillBg: Color.green(0.92),
    fillFg: '#fff',
    fillIcon: '#fff',
    fillBorder: 'rgba(40, 182, 44, 0.45)',
    border: 'rgba(40, 182, 44, 0.18)',
    shadow: `0 8px 18px -16px ${Color.green(0.26)}`
  },
  youtube: {
    background: 'rgba(255, 82, 82, 0.08)',
    text: Color.darkBluerGray(),
    icon: Color.red(),
    fillBg: Color.red(0.92),
    fillFg: '#fff',
    fillIcon: '#fff',
    fillBorder: 'rgba(255, 82, 82, 0.48)',
    border: 'rgba(255, 82, 82, 0.2)',
    shadow: `0 8px 18px -16px ${Color.red(0.26)}`
  }
} as const;

export const actionButtonClass = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  text-decoration: none;
  gap: 0.6rem;
  span {
    white-space: nowrap;
  }
  @media (max-width: ${tabletMaxWidth}) {
    gap: 0.45rem;
    width: 100%;
  }
`;

export const actionButtonFlexLargeClass = css`
  flex: 1 1 13rem;
`;

export const actionButtonFlexMediumClass = css`
  flex: 1 1 9rem;
`;

export const actionButtonFullWidthClass = css`
  flex: 1 0 100%;
  min-width: 18rem;
  @media (max-width: ${tabletMaxWidth}) {
    min-width: 0;
  }
`;

export const actionButtonsLayoutClass = css`
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 32rem;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: ${tabletMaxWidth}) {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-areas:
      'profile cards chat'
      'message message message';
    gap: 0.5rem;
  }
`;

export const profileButtonClass = css`
  @media (max-width: ${tabletMaxWidth}) {
    grid-area: profile;
  }
`;

export const cardsButtonClass = css`
  @media (max-width: ${tabletMaxWidth}) {
    grid-area: cards;
  }
`;

export const chatButtonClass = css`
  @media (max-width: ${tabletMaxWidth}) {
    grid-area: chat;
  }
`;

export const messageButtonClass = css`
  @media (max-width: ${tabletMaxWidth}) {
    grid-area: message;
  }
`;

export const rankBarWrapperClass = css`
  margin-top: -1.6rem;
  width: 100%;
  position: relative;
  z-index: 0;
  @media (max-width: ${tabletMaxWidth}) {
    margin-top: 0;
  }
`;

export const panelContainerClass = css`
  ${themedCardBase};
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  padding: 2rem 2.3rem;
  border-radius: ${borderRadius};
  content-visibility: auto;
  contain-intrinsic-size: 600px;
  font-size: 1.5rem;
  line-height: 2.3rem;
  position: relative;
  background: #fff;
  border-color: var(--themed-card-border, var(--ui-border));
  box-shadow: none;
  @media (max-width: ${tabletMaxWidth}) {
    border-radius: 0;
    padding: 1.6rem 1.4rem;
  }
`;

export const heroSectionClass = css`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 1.4rem;
  border-radius: calc(${borderRadius} - 0.6rem);
  background: var(--profile-panel-hero-bg, rgba(59, 130, 246, 0.65));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.38),
    0 10px 32px -20px rgba(15, 23, 42, 0.55);
  @media (max-width: ${tabletMaxWidth}) {
    border-radius: ${borderRadius};
  }
`;

export const heroBadgesClass = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.9rem;
  width: 100%;
  min-height: 2.5rem;
`;

export const profileContentClass = css`
  display: flex;
  gap: 2.4rem;
  flex-wrap: wrap;
  width: 100%;
  align-items: flex-start;
`;

export const leftColumnClass = css`
  flex: 0 0 20rem;
  max-width: 22rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.4rem;
  @media (max-width: ${tabletMaxWidth}) {
    flex: 1 1 100%;
    max-width: unset;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 1rem;
  }
`;

export const quickLinksClass = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  align-items: center;
  font-weight: 600;
  @media (max-width: ${tabletMaxWidth}) {
    width: auto;
    align-items: flex-end;
    gap: 0.6rem;
    grid-column: 3;
    justify-self: end;
    text-align: right;
  }
`;

export const quickLinkClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: background-color 0.18s ease, border-color 0.18s ease,
    color 0.18s ease, box-shadow 0.22s ease, transform 0.2s ease,
    filter 0.2s ease;
  text-decoration: none;
  padding: 0.55rem 0.8rem;
  border-radius: 0.6rem;
  justify-content: center;
  min-width: 0;
  width: fit-content;
  font-size: 1.2rem;
  background: var(--quick-link-bg, rgba(248, 249, 255, 0.94));
  color: var(--quick-link-fg, ${Color.darkBlueGray()});
  box-shadow: var(
    --quick-link-shadow,
    0 8px 18px -16px rgba(15, 23, 42, 0.28)
  );
  border: 1px solid var(--quick-link-border, rgba(15, 23, 42, 0.08));
  letter-spacing: 0.002em;
  svg {
    color: var(--quick-link-icon-color, currentColor);
    transition: color 0.18s ease;
  }
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: var(--quick-link-bg-hover, rgba(248, 249, 255, 0.98));
      color: var(--quick-link-fg-hover, ${Color.darkBlueGray()});
      border-color: var(--quick-link-border-hover, rgba(15, 23, 42, 0.14));
      box-shadow: var(
        --quick-link-shadow-hover,
        0 12px 24px -16px rgba(15, 23, 42, 0.32)
      );
      filter: brightness(1.03);
      svg {
        color: var(--quick-link-icon-color-hover, currentColor);
      }
    }
  }
  &:active {
    transform: translateY(0);
    filter: brightness(0.97);
  }
`;

export const detailsColumnClass = css`
  flex: 1 1 24rem;
  min-width: 20rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  position: relative;
`;

export const profilePicWrapperClass = css`
  width: 100%;
  @media (max-width: ${tabletMaxWidth}) {
    width: auto;
    grid-column: 2;
    justify-self: center;
  }
`;

export const profilePicClass = css`
  margin: 0 auto;
  display: block;
  --profile-pic-size: min(16rem, 58vw);
  @media (max-width: ${tabletMaxWidth}) {
    --profile-pic-size: min(13rem, 72vw);
  }
`;

export const actionsContainerClass = css`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
`;

export const lastActiveClass = css`
  margin-top: 1rem;
  font-size: 1.5rem;
  color: ${Color.gray()};
  @media (max-width: ${tabletMaxWidth}) {
    text-align: center;
  }
`;
