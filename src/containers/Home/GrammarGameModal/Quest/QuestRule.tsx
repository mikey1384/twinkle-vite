import React from 'react';
import { css, cx } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { GOLD, INK, PIXEL_FONT, TAG, frame } from './pixelUi';

// The item's own instruction, when it decides which answer is right. Mikey
// 11-16: as small print under big answer cards and RIGHT/WRONG badges it was
// skipped, and a grammatical "Please pick it up…" was called right. The
// deciding part there was the "scene" ("Several toy cars are scattered on
// the floor": several → them), so no part of an instruction is background:
// the whole of it is the rule, one block, every sentence the same size
// (at least the answers'), weight and colour. Never split or highlight a
// part of it.
//
// A sign of its own right above the sentence being judged, in the card's
// flow. Not pinned (sticky): on a short phone a pinned sign covered that
// sentence (320×568: only "someone trips." showed); in the flow the rule's
// last lines sit directly above it, so a card scrolled down to its answers
// still shows them together.
//
// Choices point at this sign with aria-describedby, so a screen reader reads
// the rule with each answer.
export default function QuestRule({
  id,
  instruction,
  className
}: {
  id: string;
  instruction: string;
  className?: string;
}) {
  return (
    <section
      className={cx(signCls, className)}
      aria-label="Rule for this question"
    >
      {/* the id is on the text, not the section: a description taken from
          the section would be its aria-label, not the rule */}
      <p id={id} className={ruleCls}>
        {/* the tag opens the first line, so it costs no line of its own */}
        <span className={labelCls} aria-hidden>
          RULE
        </span>
        {instruction}
      </p>
    </section>
  );
}

// a paper sign on the card
const signCls = css`
  ${frame(TAG, 2)}
  position: relative;
  margin: 0.5rem 0 1rem;
  padding: 0.6rem 0.9rem 0.7rem;
  color: ${INK};
  text-align: left;
  @media (max-width: ${mobileMaxWidth}) {
    margin: 0.4rem 0 0.8rem;
    padding: 0.4rem 0.7rem 0.6rem;
  }
  /* short screens: tighter, so the rule, the sentence being judged and the
     answers fit together */
  @media (max-height: 620px) {
    margin: 0.2rem 0 0.4rem;
    padding: 0.3rem 0.6rem 0.35rem;
  }
`;
const labelCls = css`
  ${frame(GOLD, 1)}
  display: inline-block;
  margin-right: 0.6rem;
  padding: 0.25rem 0.5rem 0.15rem;
  vertical-align: 0.15em;
  font-family: ${PIXEL_FONT};
  font-size: 1rem;
  font-weight: 400;
  line-height: 1;
  color: #3b2200;
  @media (max-height: 520px) {
    font-size: 0.85rem;
  }
`;
// the whole instruction, at least the answers' size (choices are 1.7rem,
// 1.6rem on phones, 1.4rem on short screens)
const ruleCls = css`
  margin: 0;
  font-size: 1.8rem;
  font-weight: 800;
  line-height: 1.4;
  overflow-wrap: anywhere;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.7rem;
  }
  @media (max-height: 520px) {
    font-size: 1.45rem;
    line-height: 1.3;
  }
`;
