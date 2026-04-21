import { css } from '@emotion/css';
import {
  Color,
  mediumBorderRadius,
  mobileMaxWidth
} from '~/constants/css';

export const pageClass = css`
  width: 100%;
  padding: 1rem;
  padding-bottom: 10rem;
  color: ${Color.black()};

  @media (max-width: ${mobileMaxWidth}) {
    padding: 0;
    padding-bottom: 8rem;
  }
`;

export const headerClass = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.6rem;
  padding: 1.6rem;
  border: 1px solid ${Color.borderGray()};
  border-radius: ${mediumBorderRadius};
  background: ${Color.white()};

  h1 {
    margin: 0;
    font-size: 2.8rem;
  }

  p {
    margin: 0.6rem 0 0;
    color: ${Color.darkGray()};
    font-size: 1.45rem;
    line-height: 1.45;
  }

  @media (max-width: ${mobileMaxWidth}) {
    flex-direction: column;
    border-radius: 0;
    border-left: 0;
    border-right: 0;
  }
`;

export const actionsClass = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.8rem;

  @media (max-width: ${mobileMaxWidth}) {
    width: 100%;
    justify-content: flex-start;
  }
`;

export const rangeClass = css`
  display: flex;
  overflow: hidden;
  border: 1px solid ${Color.borderGray()};
  border-radius: ${mediumBorderRadius};

  button {
    border: 0;
    border-right: 1px solid ${Color.borderGray()};
    background: ${Color.white()};
    color: ${Color.darkGray()};
    padding: 0.9rem 1.1rem;
    font-weight: 700;
    cursor: pointer;
  }

  button:last-child {
    border-right: 0;
  }

  button.active {
    background: ${Color.logoBlue(0.14)};
    color: ${Color.logoBlue()};
  }
`;

export const summaryGridClass = css`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.6rem;

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 0 1rem;
  }
`;

export const metricCardClass = css`
  border: 1px solid;
  border-radius: ${mediumBorderRadius};
  padding: 1.4rem;
  min-width: 0;

  span,
  small {
    display: block;
    color: ${Color.darkGray()};
    font-size: 1.25rem;
    font-weight: 700;
  }

  strong {
    display: block;
    margin: 0.45rem 0;
    font-size: 2.4rem;
    line-height: 1.1;
    overflow-wrap: anywhere;
  }
`;

export const panelClass = css`
  border: 1px solid ${Color.borderGray()};
  border-radius: ${mediumBorderRadius};
  background: ${Color.white()};
  overflow: hidden;
  margin-bottom: 1.6rem;

  > header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.2rem 1.4rem;
    border-bottom: 1px solid ${Color.borderGray()};
  }

  > header > div:first-child {
    min-width: 0;
    flex: 1;
  }

  h2 {
    margin: 0;
    font-size: 1.8rem;
  }

  header span {
    color: ${Color.darkGray()};
    font-size: 1.2rem;
    text-align: right;
  }

  > div {
    padding: 1.2rem;
  }

  @media (max-width: ${mobileMaxWidth}) {
    border-radius: 0;
    border-left: 0;
    border-right: 0;
  }
`;

export const twoColumnClass = css`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.6rem;

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
    gap: 0;
  }
`;

export const barsClass = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const barRowClass = css`
  display: grid;
  grid-template-columns: minmax(12rem, 0.9fr) minmax(12rem, 2fr) auto;
  align-items: center;
  gap: 1rem;
  font-size: 1.35rem;

  > div:first-child {
    min-width: 0;
  }

  > div:first-child strong,
  > div:first-child span {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  > div:first-child span {
    margin-top: 0.2rem;
    color: ${Color.darkGray()};
    font-size: 1.2rem;
  }

  .bar-track {
    height: 1rem;
    overflow: hidden;
    border-radius: 999px;
    background: ${Color.inputGray()};
  }

  .bar-track > div {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      ${Color.logoBlue()},
      ${Color.green()}
    );
  }

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
    align-items: stretch;
  }
`;

export const tableWrapClass = css`
  width: 100%;
  overflow-x: auto;

  table {
    width: 100%;
    min-width: 58rem;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 1rem;
    border-bottom: 1px solid ${Color.borderGray(0.7)};
    font-size: 1.3rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 24rem;
  }

  th {
    color: ${Color.darkGray()};
    font-size: 1.15rem;
    text-transform: uppercase;
    background: ${Color.whiteGray()};
  }

  td {
    color: ${Color.black()};
  }

  tbody tr:hover td {
    background: ${Color.whiteBlueGray()};
  }

  tbody tr.clickable-row {
    cursor: pointer;
  }

  tbody tr.active-row td {
    background: ${Color.logoBlue(0.1)};
  }

  tbody tr.clickable-row:focus {
    outline: 2px solid ${Color.logoBlue(0.45)};
    outline-offset: -2px;
  }
`;

export const detailSummaryClass = css`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.6rem;

  > div {
    min-width: 0;
    border: 1px solid ${Color.borderGray()};
    border-radius: ${mediumBorderRadius};
    padding: 1rem;
    background: ${Color.whiteGray()};
  }

  span,
  strong {
    display: block;
  }

  span {
    color: ${Color.darkGray()};
    font-size: 1.15rem;
    font-weight: 700;
  }

  strong {
    margin-top: 0.4rem;
    font-size: 1.8rem;
    overflow-wrap: anywhere;
  }

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const detailHeadingClass = css`
  margin: 1.6rem 0 0.8rem;
  font-size: 1.45rem;
`;

export const subsectionHeaderClass = css`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin: 1.6rem 0 0.8rem;

  h3 {
    margin: 0;
    font-size: 1.45rem;
  }

  span {
    color: ${Color.darkGray()};
    font-size: 1.2rem;
    font-weight: 700;
    text-align: right;
  }

  @media (max-width: ${mobileMaxWidth}) {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.35rem;
  }
`;

export const paginationFooterClass = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1.2rem 0 0.2rem;

  span {
    color: ${Color.red()};
    font-size: 1.25rem;
    font-weight: 700;
  }
`;

export const detailErrorClass = css`
  padding: 1.4rem;
  border: 1px solid ${Color.red(0.25)};
  border-radius: ${mediumBorderRadius};
  color: ${Color.red()};
  background: ${Color.red(0.06)};
  font-size: 1.35rem;
`;

export const emptyStateClass = css`
  display: flex;
  min-height: 24rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.4rem;
  color: ${Color.darkGray()};
  font-size: 1.6rem;
  text-align: center;
`;

export const emptyInlineClass = css`
  padding: 2rem;
  color: ${Color.darkGray()};
  text-align: center;
  font-size: 1.4rem;
`;
