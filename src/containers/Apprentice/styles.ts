import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';

// The /apprentice page: one calm column, white panels on the site's page
// background, the logo blue as the only accent.
export const pageClass = css`
  width: 100%;
  min-height: 100%;
  padding: 3.5rem 2rem 8rem;
  color: ${Color.darkerGray()};
  font-size: 1.6rem;
  line-height: 1.65;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.6rem 1rem 9rem;
    font-size: 1.5rem;
  }
`;

export const columnClass = css`
  max-width: 82rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

export const panelClass = css`
  background: #fff;
  border: 1px solid ${Color.borderGray()};
  border-radius: ${borderRadius};
  padding: 2.6rem 2.8rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.8rem 1.6rem;
  }
`;

export const heroClass = css`
  ${panelClass};
  padding: 3.6rem 3.2rem 3.2rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 2.4rem 1.8rem;
  }
`;

export const eyebrowClass = css`
  margin: 0 0 0.8rem;
  color: ${Color.logoBlue()};
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const titleClass = css`
  margin: 0;
  color: ${Color.black()};
  font-size: 3.6rem;
  line-height: 1.15;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 2.7rem;
  }
`;

export const leadClass = css`
  margin: 1.6rem 0 0;
  color: ${Color.darkGray()};
  font-size: 1.85rem;
  line-height: 1.6;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.6rem;
  }
`;

export const bylineClass = css`
  margin-top: 1.8rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 1.6rem;
  color: ${Color.gray()};
  font-size: 1.35rem;
  span {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

export const sectionTitleClass = css`
  margin: 0 0 1.2rem;
  color: ${Color.black()};
  font-size: 2.2rem;
  line-height: 1.3;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.9rem;
  }
`;

export const proseClass = css`
  p {
    margin: 0 0 1.2rem;
  }
  p:last-child {
    margin-bottom: 0;
  }
`;

export const qualityGridClass = css`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.2rem;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const qualityClass = css`
  border: 1px solid ${Color.borderGray()};
  border-radius: 10px;
  padding: 1.5rem 1.6rem;
  background: ${Color.whiteGray()};
  h3 {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    margin: 0 0 0.5rem;
    font-size: 1.6rem;
    color: ${Color.black()};
  }
  h3 svg {
    color: ${Color.logoBlue()};
  }
  p {
    margin: 0;
    color: ${Color.darkGray()};
    font-size: 1.45rem;
  }
`;

export const mustClass = css`
  margin-top: 1.2rem;
  border-left: 4px solid ${Color.logoBlue()};
  padding: 0.4rem 0 0.4rem 1.4rem;
  color: ${Color.darkerGray()};
  b {
    color: ${Color.black()};
  }
`;

export const listClass = css`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  li {
    display: grid;
    grid-template-columns: 2.4rem minmax(0, 1fr);
    gap: 1rem;
    align-items: start;
  }
  li > svg {
    margin-top: 0.4rem;
    color: ${Color.logoBlue()};
  }
  b {
    color: ${Color.black()};
  }
`;

export const honestyClass = css`
  ${panelClass};
  background: ${Color.whiteBlueGray()};
  border-color: ${Color.logoBlue(0.25)};
`;

export const formHeaderClass = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.2rem;
  flex-wrap: wrap;
  margin-bottom: 1.6rem;
`;

export const statusClass = css`
  color: ${Color.gray()};
  font-size: 1.35rem;
  margin-top: 0.2rem;
`;

export const questionClass = css`
  margin-top: 2.2rem;
  label {
    display: block;
    font-weight: 700;
    font-size: 1.65rem;
    color: ${Color.black()};
  }
`;

export const hintClass = css`
  margin: 0.3rem 0 0.8rem;
  color: ${Color.gray()};
  font-size: 1.35rem;
  line-height: 1.5;
`;

export const optionalClass = css`
  margin-left: 0.6rem;
  font-weight: 400;
  color: ${Color.gray()};
  font-size: 1.3rem;
`;

export const counterClass = css`
  margin-top: 0.4rem;
  text-align: right;
  font-size: 1.2rem;
  color: ${Color.gray()};
`;

export const picksClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin: 0.4rem 0 1rem;
`;

export const pickRowClass = css`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.2rem;
  border: 1px solid ${Color.borderGray()};
  border-radius: 10px;
  background: #fff;
  a {
    flex: 1;
    min-width: 0;
    font-weight: 700;
    color: ${Color.black()};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const pickTypeClass = css`
  flex-shrink: 0;
  font-size: 1.2rem;
  color: ${Color.gray()};
`;

export const footerClass = css`
  margin-top: 2.6rem;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1.2rem;
  flex-wrap: wrap;
`;

export const errorClass = css`
  margin-top: 1.4rem;
  color: ${Color.red()};
  font-size: 1.4rem;
`;

export const confirmationClass = css`
  ${panelClass};
  text-align: center;
  padding: 3.4rem 2.8rem;
  h2 {
    margin: 1rem 0 0.6rem;
    font-size: 2.4rem;
    color: ${Color.black()};
  }
  p {
    margin: 0 auto 0.8rem;
    max-width: 56rem;
    color: ${Color.darkGray()};
  }
  > svg {
    color: ${Color.logoBlue()};
  }
`;

export const advisorClass = css`
  ${panelClass};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.6rem;
  @media (max-width: ${mobileMaxWidth}) {
    flex-direction: column;
    align-items: flex-start;
  }
  p {
    margin: 0;
    color: ${Color.darkGray()};
  }
`;
