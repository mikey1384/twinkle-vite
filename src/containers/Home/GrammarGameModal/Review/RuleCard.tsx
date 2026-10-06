import React from 'react';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

// The API also sends Korean notes (nameKo, ruleKo, whyKo); the card shows
// English only, because player UI is English-only (Mikey 2026-09-27: Korean
// is for parents).
export interface ReviewRuleCard {
  skill: string;
  nameEn: string;
  why: string;
  wrongChoices: { choice: string; error: string }[];
}

export default function RuleCard({
  card,
  pickedChoice
}: {
  card: ReviewRuleCard;
  pickedChoice: string | null;
}) {
  const picked = pickedChoice
    ? card.wrongChoices.find((w) => w.choice === pickedChoice)
    : undefined;
  const others = card.wrongChoices.filter((w) => w !== picked);

  return (
    <div className={cardCls}>
      <div className={labelCls}>Grammar point</div>
      <div className={nameCls}>{card.nameEn}</div>
      <div className={whyCls}>{card.why}</div>
      {picked && (
        <div className={pickedCls}>
          <b>Your pick:</b> {mistakeText(picked)}
        </div>
      )}
      {others.length > 0 && (
        <ul className={wrongListCls}>
          {others.map((w) => (
            <li key={w.choice}>{mistakeText(w)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// The labels usually quote the choice already ("\"whom\" for a thing"); add
// it only when they don't, so the note never reads the choice twice.
function mistakeText(w: { choice: string; error: string }) {
  const named = w.error.toLowerCase().includes(w.choice.trim().toLowerCase());
  return named ? w.error : `“${w.choice}”: ${w.error}`;
}

const cardCls = css`
  margin-top: 0.75rem;
  padding: 0.9rem 1.1rem;
  border-left: 4px solid ${Color.logoBlue()};
  background: ${Color.wellGray(0.5)};
  border-radius: 8px;
  color: ${Color.darkerGray()};
  font-size: 1.35rem;
  line-height: 1.5;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.3rem;
    padding: 0.8rem 0.9rem;
  }
`;

const labelCls = css`
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${Color.logoBlue()};
`;

const nameCls = css`
  font-weight: 700;
  font-size: 1.45rem;
  color: ${Color.black()};
`;

const whyCls = css`
  margin-top: 0.5rem;
`;

const pickedCls = css`
  margin-top: 0.6rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  background: ${Color.rose(0.08)};
`;

const wrongListCls = css`
  margin: 0.5rem 0 0;
  padding-left: 1.2rem;
  color: ${Color.darkerGray()};
  font-size: 1.25rem;
`;
