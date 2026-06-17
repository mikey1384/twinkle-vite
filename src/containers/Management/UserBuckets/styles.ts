import { css } from '@emotion/css';
import { Color, mediumBorderRadius, mobileMaxWidth } from '~/constants/css';

export const banStatusClass = css`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  border: 1px solid;
  border-radius: ${mediumBorderRadius};
  padding: 1rem 1.2rem;
  margin-bottom: 1.4rem;
  font-size: 1.3rem;
  font-weight: 800;
  line-height: 1.4;

  &.banned {
    border-color: ${Color.rose(0.45)};
    background: ${Color.rose(0.1)};
    color: ${Color.rose()};
  }

  &.ok {
    border-color: ${Color.green(0.45)};
    background: ${Color.green(0.1)};
    color: ${Color.green()};
  }
`;

export const typeSummaryClass = css`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.6rem;

  > div {
    min-width: 0;
    border: 1px solid ${Color.borderGray()};
    border-radius: ${mediumBorderRadius};
    background: ${Color.whiteGray()};
    padding: 1rem;
  }

  > div span {
    display: block;
    color: ${Color.darkGray()};
    font-size: 1.1rem;
    font-weight: 800;
    text-transform: uppercase;
  }

  > div strong {
    display: block;
    margin-top: 0.3rem;
    font-size: 2rem;
    line-height: 1.1;
  }

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const banMessageClass = css`
  width: 100%;
  font-size: 1.25rem;
  line-height: 1.4;
  padding: 0.85rem 1rem;
  border: 1px solid ${Color.borderGray()};
  border-radius: ${mediumBorderRadius};
  resize: vertical;
  font-family: inherit;
`;

export const banMessageHintClass = css`
  margin-top: 0.6rem;
  color: ${Color.darkGray()};
  font-size: 1.1rem;
`;

export const memberListClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

export const memberRowClass = css`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.9rem;
  border: 1px solid ${Color.borderGray()};
  border-radius: ${mediumBorderRadius};
  background: ${Color.white()};
  padding: 0.8rem 1rem;

  .member-icon {
    width: 2.8rem;
    height: 2.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: ${Color.logoBlue(0.12)};
    color: ${Color.logoBlue()};
    font-size: 1.25rem;
  }

  .member-main {
    min-width: 0;
  }

  .member-main strong {
    display: block;
    font-size: 1.3rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .member-main span {
    display: block;
    margin-top: 0.15rem;
    color: ${Color.darkGray()};
    font-size: 1.05rem;
    font-weight: 800;
    text-transform: uppercase;
  }

  &:hover {
    background: ${Color.whiteBlueGray()};
  }
`;

export const migrateCardClass = css`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.6rem;
  padding: 1rem 1.2rem;
  border: 1px solid ${Color.borderGray()};
  border-radius: ${mediumBorderRadius};
  background: ${Color.white()};

  .migrate-text {
    min-width: 0;
    flex: 1;
  }

  .migrate-text strong {
    display: block;
    font-size: 1.25rem;
  }

  .migrate-text span {
    display: block;
    margin-top: 0.2rem;
    color: ${Color.darkGray()};
    font-size: 1.1rem;
    line-height: 1.4;
  }

  .migrate-text span.migrate-result {
    color: ${Color.logoBlue()};
    font-weight: 700;
  }

  @media (max-width: ${mobileMaxWidth}) {
    border-radius: 0;
    border-left: 0;
    border-right: 0;
  }
`;

export const emptyMembersClass = css`
  border: 1px dashed ${Color.borderGray()};
  border-radius: ${mediumBorderRadius};
  background: ${Color.whiteGray()};
  color: ${Color.darkGray()};
  padding: 1.4rem;
  text-align: center;
  font-size: 1.25rem;
`;

export const addGridClass = css`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.2rem;

  .add-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
  }

  .add-field > label {
    color: ${Color.darkGray()};
    font-size: 1.15rem;
    font-weight: 800;
    text-transform: uppercase;
  }

  .add-row {
    display: flex;
    gap: 0.6rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .add-row input {
    min-width: 0;
    flex: 1;
    border: 1px solid ${Color.borderGray()};
    border-radius: ${mediumBorderRadius};
    padding: 0.85rem 1rem;
    font-size: 1.3rem;
  }

  .add-hint {
    color: ${Color.darkGray()};
    font-size: 1.05rem;
    line-height: 1.4;
  }

  .add-warn {
    color: ${Color.rose()};
    font-size: 1.05rem;
    line-height: 1.4;
  }

  .prefix-toggle {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: ${Color.darkGray()};
    font-size: 1.1rem;
    font-weight: 700;
  }

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
  }
`;
