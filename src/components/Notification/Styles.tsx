import { css } from '@emotion/css';
import {
  Color,
  liftedBoxShadow,
  mobileMaxWidth,
  wideBorderRadius
} from '~/constants/css';

export const container = css`
  padding-top: 1rem;
  padding-bottom: 1rem;
  font-size: 1.5rem;
  background: var(--noti-bg, transparent);
  border: none;
  box-shadow: ${liftedBoxShadow};
  border-radius: ${wideBorderRadius};
  @media (max-width: ${mobileMaxWidth}) {
    border-radius: 0;
    border-left: 0;
    border-right: 0;
    > section {
      min-height: 0;
    }
  }
`;

export const notiFilterBar = css`
  background: linear-gradient(
      160deg,
      ${Color.white(0.95)} 0%,
      ${Color.whiteGray()} 100%
    ) !important;
  border: 1px solid ${Color.borderGray(0.65)} !important;
  box-shadow: inset 0 1px 0 ${Color.white(0.85)},
    0 10px 24px rgba(15, 23, 42, 0.14) !important;
  backdrop-filter: blur(6px);
  border-radius: ${wideBorderRadius};

  @media (max-width: ${mobileMaxWidth}) {
    border-radius: 0;
    border-left: 0;
    border-right: 0;
    box-shadow: inset 0 1px 0 ${Color.white(0.75)},
      0 6px 14px rgba(15, 23, 42, 0.12) !important;
  }
`;

export const notiFeedListItem = css`
  white-space: pre-wrap;
  overflow-wrap: break-word;
  word-break: break-word;
  background: #fff;
  border: 1px solid ${Color.borderGray()};
  border-radius: ${wideBorderRadius};
  padding: 1rem 1.2rem;
  margin-bottom: 1.2rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  > small {
    color: ${Color.gray()};
    flex: 0 0 auto;
    white-space: nowrap;
  }
`;
