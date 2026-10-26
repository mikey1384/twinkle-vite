import React from 'react';
import { css } from '@emotion/css';
import { INK, PARCHMENT, PIXEL_FONT, frame } from '../Quest/pixelUi';
import QuestMisses from './QuestMisses';

export default function QuestReview() {
  return (
    <section className={boardCls} aria-label="Quest review">
      <header>
        <h2>Review</h2>
        <p>
          Your missed questions, newest first. Challenge an answer or report a
          problem to Mikey — even if the question was already reviewed.
        </p>
      </header>
      <div className={listCls}>
        <QuestMisses look="quest" />
      </div>
    </section>
  );
}

const boardCls = css`
  ${frame(PARCHMENT, 2)}
  color: ${INK};
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 90rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  header {
    padding: 1.2rem 1.4rem 0.8rem;
    flex-shrink: 0;
  }
  h2 {
    font-family: ${PIXEL_FONT};
    font-size: 1.8rem;
    margin: 0 0 1rem;
  }
  p {
    font-size: 1.4rem;
    line-height: 1.5;
    margin: 0;
  }
`;
const listCls = css`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0.6rem 1.2rem 1.2rem;
`;
