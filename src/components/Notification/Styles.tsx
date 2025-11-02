import { css } from '@emotion/css';
import { Color, mobileMaxWidth, borderRadius } from '~/constants/css';

export const container = css`
  padding-top: 1rem;
  padding-bottom: 1rem;
  font-size: 1.5rem;
  background: var(--noti-bg, transparent);
  border: none;
  box-shadow: none;
  border-radius: ${borderRadius};
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
  background: #fff !important;
  box-shadow: none !important;
  backdrop-filter: none;
  border-radius: ${borderRadius};

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
  border: none;
  border-radius: ${borderRadius};
  padding: 1rem 1.2rem;
  margin-bottom: 1.2rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 0.6rem;
  > small {
    align-self: flex-end;
    color: ${Color.gray()};
    white-space: nowrap;
    margin-top: 0.2rem;
  }
`;
