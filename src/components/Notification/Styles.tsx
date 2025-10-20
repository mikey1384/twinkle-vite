import { css } from '@emotion/css';
import { Color, mobileMaxWidth, wideBorderRadius } from '~/constants/css';

export const container = css`
  padding-top: 1rem;
  padding-bottom: 1rem;
  font-size: 1.5rem;
  background: var(--noti-bg, transparent);
  border: none;
  box-shadow: none;
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
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
  backdrop-filter: none;
  border-radius: 0;

  @media (max-width: ${mobileMaxWidth}) {
    border-radius: 0;
    border-left: 0;
    border-right: 0;
    box-shadow: none !important;
  }
`;

export const notiFeedListItem = css`
  white-space: pre-wrap;
  overflow-wrap: break-word;
  word-break: break-word;
  background: #fff;
  border: 1px solid var(--ui-border);
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
