import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

export const pageWidthClass = css`
  width: 80%;
  max-width: 1100px;
  margin-top: 1rem;
  @media (max-width: ${mobileMaxWidth}) {
    width: 100%;
    margin-top: 0;
  }
`;

export const sectionClass = css`
  border-radius: 1.4rem;
  border: 1px solid var(--ui-border);
  background: #fff;
  padding: 2rem;
  margin-top: 2rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.4rem 1rem;
    border-radius: 0;
    border-left: 0;
    border-right: 0;
  }
`;

export const backLinkClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.4rem;
  font-weight: bold;
  color: ${Color.logoBlue()};
  @media (max-width: ${mobileMaxWidth}) {
    margin: 1rem 1rem 0;
  }
`;
