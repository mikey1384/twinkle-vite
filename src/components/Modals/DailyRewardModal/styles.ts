import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export const loadingWrapClass = css`
  display: grid;
  place-items: center;
  min-height: 30vh;
  width: 100%;
`;

export const contentClass = css`
  width: 100%;

  .fadeIn {
    animation: fadeInEffect 1s ease-in;
  }

  @keyframes fadeInEffect {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes popEffect {
    0% {
      transform: scale(0.9);
      opacity: 0.7;
    }
    50% {
      transform: scale(1.2);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  .chosenCardWrapper {
    animation: popEffect 0.6s ease-out;
  }
`;

export const contentGridClass = css`
  display: grid;
  grid-auto-rows: max-content;
  row-gap: 1.6rem;
  width: 100%;
  min-height: 30vh;
  justify-items: center;
  align-content: center;

  &.revealed {
    align-content: start;
  }
`;

export const summaryContainerClass = css`
  margin-top: 2.5rem;
  width: 100%;
  max-width: 60rem;
  justify-self: center;
  margin-left: auto;
  margin-right: auto;
  display: grid;
  grid-auto-rows: max-content;
  row-gap: 1.6rem;
`;

export const summaryHeadlineClass = css`
  font-size: 3rem;
  font-weight: 800;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  @media (max-width: 480px) {
    font-size: 2.25rem;
  }
`;

export const summaryRowClass = css`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  column-gap: 1rem;
  width: 100%;
`;

export const summaryColLeft = css`
  font-size: 1.55rem;
  line-height: 1.4;
  color: #111827;
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
  @media (max-width: 480px) {
    font-size: 1.45rem;
    white-space: normal;
    overflow-wrap: anywhere;
    min-width: 0;
  }
`;

export const summaryColCenter = css`
  font-size: 1.55rem;
  font-weight: 700;
  color: ${Color.purple()};
  display: grid;
  grid-auto-flow: column;
  align-items: center;
  justify-self: center;
  justify-content: center;
  column-gap: 0.75rem;
  min-width: 11rem;
  @media (max-width: 480px) {
    font-size: 1.45rem;
    column-gap: 0.5rem;
    min-width: 0;
    justify-content: start;
    justify-items: start;
    text-align: left;
  }
`;

export const summaryColRight = css`
  text-align: right;
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1.4;
  min-width: 11rem;
  display: grid;
  grid-auto-flow: column;
  grid-template-columns: max-content max-content;
  justify-self: end;
  justify-content: end;
  align-items: center;
  column-gap: 0.5rem;
  @media (max-width: 480px) {
    font-size: 1.45rem;
    min-width: 0;
  }
`;

export const rewardHighlightClass = css`
  display: grid;
  grid-auto-rows: max-content;
  row-gap: 0.8rem;
  align-items: center;
  justify-items: center;
  padding: 1.4rem 2rem;
  text-align: center;
  @media (max-width: 480px) {
    padding: 1rem 1.2rem;
  }
`;

export const rewardAmountClass = css`
  font-size: 3.1rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  @media (max-width: 480px) {
    font-size: 2.2rem;
  }
`;

export const bonusMessageClass = css`
  text-align: center;
  font-size: 1.6rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  padding: 1.1rem 1.6rem;
  @media (max-width: 480px) {
    font-size: 1.45rem;
    padding: 0.9rem 1.2rem;
    gap: 0.6rem;
  }
`;

export const bonusFailClass = css`
  color: ${Color.rose()};
`;

export const coinsNumberClass = css`
  display: inline-block;
  text-align: right;
  font-variant-numeric: tabular-nums;
  @media (max-width: 480px) {
    width: auto !important;
  }
`;
