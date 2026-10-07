import React from 'react';
import { css, cx } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { mistakeText } from '~/helpers/grammarblesRuleCard';
import { NEON, READ_FONT, rgba } from '../ClassicArcade/theme';
import {
  INK,
  NIGHT,
  PIXEL_FONT,
  TAG,
  frame,
  type Palette
} from '../Quest/pixelUi';

// Korean notes show under or beside their English line when the learner has
// them on (Mikey 10-06: learning aids may show Korean, but English stays the
// main text and Korean is secondary). Every Korean line has its English pair;
// the skill's Korean-only rule (ruleKo) is therefore not shown.
export interface ReviewRuleCard {
  skill: string;
  nameEn: string;
  nameKo?: string | null;
  ruleKo?: string | null;
  why: string;
  whyKo?: string | null;
  wrongChoices: { choice: string; error: string }[];
}

// One card, drawn in the look of the screen it sits on (Mikey 10-08: the
// old grey site card was hard to read on the dark boss and neon screens and
// looked like neither game): 'quest' on Quest's parchment cards, 'boss' on
// the dark boss card, 'classic' on Classic's neon Review.
export type RuleCardLook = 'quest' | 'boss' | 'classic';

export default function RuleCard({
  card,
  look,
  pointOnly = false,
  pickedChoice,
  koreanShown,
  onToggleKorean
}: {
  card: ReviewRuleCard;
  look: RuleCardLook;
  pointOnly?: boolean;
  pickedChoice: string | null;
  koreanShown: boolean;
  onToggleKorean: () => void;
}) {
  const k = LOOKS[look];
  const hasKorean = !!(card.nameKo || card.whyKo);
  const header = (
    <div className={headCls}>
      <div>
        <div className={cx(labelCls, k.label)}>Grammar point</div>
        <div className={cx(nameCls, k.name)}>
          {card.nameEn}
          {koreanShown && card.nameKo && (
            <span className={cx(nameKoCls, k.soft)}>{card.nameKo}</span>
          )}
        </div>
      </div>
      {hasKorean && (
        <button className={cx(toggleCls, k.toggle)} onClick={onToggleKorean}>
          {koreanShown ? '한국어 숨기기' : '한국어'}
        </button>
      )}
    </div>
  );
  if (pointOnly) {
    return <div className={cx(cardCls, k.card)}>{header}</div>;
  }
  const picked = pickedChoice
    ? card.wrongChoices.find((w) => w.choice === pickedChoice)
    : undefined;
  const others = card.wrongChoices.filter((w) => w !== picked);

  return (
    <div className={cx(cardCls, k.card)}>
      {header}
      <div className={whyCls}>{card.why}</div>
      {koreanShown && card.whyKo && (
        <div className={cx(koCls, k.soft)}>{card.whyKo}</div>
      )}
      {picked && (
        <div className={cx(pickedCls, k.picked)}>
          <b>Your pick:</b> {mistakeText(picked)}
        </div>
      )}
      {others.length > 0 && (
        <ul className={cx(wrongListCls, k.list)}>
          {others.map((w) => (
            <li key={w.choice}>{mistakeText(w)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// layout shared by every look; colours, fonts and frames come from LOOKS
const cardCls = css`
  margin-top: 0.75rem;
  padding: 0.9rem 1.1rem;
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
`;
const nameCls = css`
  font-weight: 700;
  font-size: 1.45rem;
`;
const whyCls = css`
  margin-top: 0.5rem;
`;
const pickedCls = css`
  margin-top: 0.6rem;
  padding: 0.5rem 0.75rem;
`;
const wrongListCls = css`
  margin: 0.5rem 0 0;
  padding-left: 1.2rem;
  font-size: 1.25rem;
`;
const headCls = css`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
`;
const nameKoCls = css`
  margin-left: 0.6rem;
  font-size: 0.85em;
  font-weight: 500;
`;
const toggleCls = css`
  flex-shrink: 0;
  padding: 0.3rem 0.9rem;
  font-size: 1.15rem;
  font-weight: 700;
  cursor: pointer;
`;
const koCls = css`
  margin-top: 0.25rem;
  font-size: 0.88em;
`;

// the dark boss card's inner panel: a step lighter than the card around it
const DUSK: Palette = {
  k: '#0d0816',
  l: '#7a56a6',
  f: '#2a1d44',
  s: '#1a1130'
};
const PIXEL_LABEL = `
  font-family: ${PIXEL_FONT};
  font-weight: 400;
  font-size: 0.85rem;
  line-height: 1.6;
`;

const LOOKS: Record<
  RuleCardLook,
  Record<
    'card' | 'label' | 'name' | 'soft' | 'picked' | 'list' | 'toggle',
    string
  >
> = {
  quest: {
    card: css`
      ${frame(TAG, 2)}
      color: ${INK};
    `,
    label: css`
      ${PIXEL_LABEL}
      color: #8a5200;
    `,
    name: css`
      color: ${INK};
    `,
    soft: css`
      color: #6b5a3a;
    `,
    picked: css`
      background: #ffe3ea;
      border: 2px solid #e8899d;
      color: ${INK};
    `,
    list: css`
      color: ${INK};
    `,
    toggle: css`
      ${frame(TAG, 2)}
      font-family: ${PIXEL_FONT};
      font-weight: 400;
      font-size: 0.85rem;
      color: ${INK};
    `
  },
  boss: {
    card: css`
      ${frame(DUSK, 2)}
      color: #f3eefc;
    `,
    label: css`
      ${PIXEL_LABEL}
      color: #ffcb32;
    `,
    name: css`
      color: #ffffff;
    `,
    soft: css`
      color: #c9b8ea;
    `,
    picked: css`
      background: rgba(255, 77, 109, 0.18);
      border: 2px solid rgba(255, 77, 109, 0.55);
      color: #ffe3ea;
    `,
    list: css`
      color: #e4daf7;
    `,
    toggle: css`
      ${frame(NIGHT, 2)}
      font-family: ${PIXEL_FONT};
      font-weight: 400;
      font-size: 0.85rem;
      color: #f3eefc;
    `
  },
  classic: {
    card: css`
      border-radius: 12px;
      border-left: 3px solid ${NEON.cyan};
      background: rgba(7, 11, 46, 0.65);
      box-shadow: inset 0 0 18px ${rgba(NEON.violetRgb, 0.18)};
      font-family: ${READ_FONT};
      color: ${NEON.ink};
    `,
    label: css`
      ${PIXEL_LABEL}
      color: ${NEON.cyan};
      text-shadow: 0 0 8px ${rgba(NEON.cyanRgb, 0.6)};
    `,
    name: css`
      color: #ffffff;
    `,
    soft: css`
      color: ${NEON.inkSoft};
    `,
    picked: css`
      border-radius: 8px;
      background: ${rgba(NEON.redRgb, 0.15)};
      border: 1px solid ${rgba(NEON.redRgb, 0.5)};
      color: ${NEON.ink};
    `,
    list: css`
      color: ${NEON.inkSoft};
    `,
    toggle: css`
      border-radius: 999px;
      background: rgba(12, 14, 56, 0.9);
      border: 2px solid ${rgba(NEON.cyanRgb, 0.5)};
      color: ${NEON.cyan};
      font-family: ${READ_FONT};
    `
  }
};
