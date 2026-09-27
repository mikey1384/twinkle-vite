import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';

// The invite sign-up steps (InvitePass, AgeCheck, GuardianConsent) share
// one look: a centred column, a big title, short copy, one blue button.
export const stepClass = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1.2rem;
`;

export const titleClass = css`
  font-size: 2.6rem;
  font-weight: 700;
  color: ${Color.darkerGray()};
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 2rem;
  }
`;

export const bodyClass = css`
  max-width: 46rem;
  margin: 0;
  font-size: 1.6rem;
  line-height: 1.5;
  color: ${Color.darkerGray()};
`;

export const noteClass = css`
  max-width: 46rem;
  margin: 0;
  font-size: 1.4rem;
  line-height: 1.5;
  color: ${Color.darkGray()};
`;

export const errorClass = css`
  max-width: 46rem;
  margin: 0;
  font-size: 1.4rem;
  color: #c0392b;
`;

export const primaryButtonClass = css`
  margin-top: 0.8rem;
  background-color: #0088ee;
  color: #fff;
  border: none;
  padding: 12px 28px;
  font-size: 1.9rem;
  font-weight: 700;
  border-radius: ${borderRadius};
  cursor: pointer;
  &:hover:not(:disabled),
  &:focus-visible {
    background-color: #0066bb;
  }
  &:focus-visible {
    outline: 3px solid #99ccff;
    outline-offset: 2px;
  }
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

export const linkButtonClass = css`
  background: none;
  border: none;
  color: ${Color.darkGray()};
  font-size: 1.3rem;
  text-decoration: underline;
  cursor: pointer;
  &:focus-visible {
    outline: 3px solid #99ccff;
    outline-offset: 2px;
    border-radius: 4px;
  }
`;

export const fieldClass = css`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
  width: 100%;
  max-width: 36rem;
  text-align: left;
  label {
    font-size: 1.4rem;
    color: ${Color.darkerGray()};
  }
`;

export const selectClass = css`
  width: 100%;
  font-size: 1.7rem;
  padding: 0.8rem 1rem;
  border: 1px solid var(--ui-border);
  border-radius: ${borderRadius};
  background: #fff;
  color: ${Color.darkerGray()};
  cursor: pointer;
  &:focus-visible {
    outline: 3px solid #99ccff;
    outline-offset: 1px;
  }
`;
