import React from 'react';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

export interface ReviewRuleCard {
  skill: string;
  nameEn: string;
  nameKo: string;
  ruleKo: string | null;
  why: string;
  whyKo: string | null;
  wrongChoices: { choice: string; error: string }[];
}

const KO_PREF_KEY = 'grammarblesRuleCardKorean';

// Korean notes are on by default for Korean-language browsers (Mikey
// 2026-09-27); anyone can switch them on or off, and the choice is remembered.
export function initialKoreanShown() {
  try {
    const saved = localStorage.getItem(KO_PREF_KEY);
    if (saved === '1') return true;
    if (saved === '0') return false;
  } catch {
    // storage can be blocked; fall back to the browser language
  }
  const languages =
    typeof navigator === 'undefined'
      ? []
      : navigator.languages?.length
        ? navigator.languages
        : [navigator.language];
  return languages.some((lang) => /^ko\b/i.test(String(lang || '')));
}

export function saveKoreanShown(shown: boolean) {
  try {
    localStorage.setItem(KO_PREF_KEY, shown ? '1' : '0');
  } catch {
    // not remembered; the toggle still works for this visit
  }
}

export default function RuleCard({
  card,
  pickedChoice,
  koreanShown,
  onToggleKorean
}: {
  card: ReviewRuleCard;
  pickedChoice: string | null;
  koreanShown: boolean;
  onToggleKorean: () => void;
}) {
  const picked = pickedChoice
    ? card.wrongChoices.find((w) => w.choice === pickedChoice)
    : undefined;
  const others = card.wrongChoices.filter((w) => w !== picked);
  const hasKorean = !!(card.whyKo || card.ruleKo);

  return (
    <div className={cardCls}>
      <div className={headCls}>
        <div>
          <div className={labelCls}>Grammar point</div>
          <div className={nameCls}>
            {card.nameEn}
            {koreanShown && card.nameKo && (
              <span className={nameKoCls}>{card.nameKo}</span>
            )}
          </div>
        </div>
        {hasKorean && (
          <button className={toggleCls} onClick={onToggleKorean}>
            {koreanShown ? '한국어 숨기기' : '한국어'}
          </button>
        )}
      </div>
      <div className={whyCls}>{card.why}</div>
      {koreanShown && card.whyKo && <div className={koCls}>{card.whyKo}</div>}
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
      {koreanShown && card.ruleKo && (
        <div className={ruleKoCls}>
          <span className={labelCls}>규칙</span> {card.ruleKo}
        </div>
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

const headCls = css`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
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

const nameKoCls = css`
  margin-left: 0.6rem;
  font-weight: 600;
  color: ${Color.darkerGray()};
`;

const toggleCls = css`
  flex-shrink: 0;
  border: 1px solid var(--ui-border);
  background: #fff;
  border-radius: 999px;
  padding: 0.3rem 0.9rem;
  font-size: 1.15rem;
  font-weight: 700;
  color: ${Color.darkerGray()};
  cursor: pointer;
`;

const whyCls = css`
  margin-top: 0.5rem;
`;

const koCls = css`
  margin-top: 0.35rem;
  color: ${Color.darkerGray()};
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

const ruleKoCls = css`
  margin-top: 0.6rem;
  padding-top: 0.5rem;
  border-top: 1px dashed var(--ui-border);
`;
