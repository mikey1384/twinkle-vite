import React, { useState } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { GUIDE_PICTURE } from '~/containers/App/WelcomeTour/Greeter';
import {
  GUIDE_COLOR,
  GUIDE_SOFT,
  choiceChipClass,
  choiceGridClass,
  ghostButtonClass,
  ownInputClass,
  primaryButtonClass,
  questionClass
} from '~/containers/App/WelcomeTour/styles';
import { mobileMaxWidth } from '~/constants/css';
import type { MemberChoiceQuestion } from '~/helpers/sponsoredHelp';

// A multiple-choice question Zero/Ciel's planner designed for one objective
// (twinkle-api helpers/sponsoredHelp/memberChoice.ts), in the welcome tour's
// dialogue look: the guide's picture, the question, its answers to tap and
// "Type your own…". The answer goes to the server; nothing is built until a
// plan is made and the member confirms it.
export default function WandChoice({
  persona,
  question,
  working,
  onAnswer
}: {
  persona: 'zero' | 'ciel';
  question: MemberChoiceQuestion;
  working?: boolean;
  onAnswer: (answer: string) => void;
}) {
  const [typingOwn, setTypingOwn] = useState(false);
  const [own, setOwn] = useState('');
  const name = persona === 'ciel' ? 'Ciel' : 'Zero';
  return (
    <div
      className={panelClass}
      style={
        {
          '--guide': GUIDE_COLOR[persona],
          '--guide-soft': GUIDE_SOFT[persona]
        } as React.CSSProperties
      }
      data-wand-question
    >
      <img className={portraitClass} src={GUIDE_PICTURE[persona]} alt={name} />
      <div className={bodyClass}>
        <span className={nameClass}>{name}</span>
        <p className={questionClass}>{question.question}</p>
        {!typingOwn ? (
          <div className={choiceGridClass}>
            {question.options.map((option) => (
              <button
                key={option}
                type="button"
                className={choiceChipClass}
                disabled={working}
                onClick={() => onAnswer(option)}
              >
                {option}
              </button>
            ))}
            <button
              type="button"
              className={choiceChipClass}
              disabled={working}
              onClick={() => setTypingOwn(true)}
            >
              <Icon icon="pencil-alt" /> Type your own…
            </button>
          </div>
        ) : (
          <>
            <input
              className={ownInputClass}
              autoFocus
              maxLength={300}
              placeholder={question.ownHint || 'Type your own answer'}
              value={own}
              onChange={(event) => setOwn(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && own.trim()) onAnswer(own.trim());
              }}
            />
            <div className={ownActionsClass}>
              <button
                type="button"
                className={ghostButtonClass}
                onClick={() => {
                  setTypingOwn(false);
                  setOwn('');
                }}
              >
                <Icon icon="chevron-left" /> Back
              </button>
              <button
                type="button"
                className={primaryButtonClass}
                disabled={!own.trim() || working}
                onClick={() => onAnswer(own.trim())}
              >
                {working ? 'Sending…' : 'Send'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const panelClass = css`
  margin-top: 0.8rem;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1.1rem 1.2rem;
  border-radius: 1.2rem;
  background: #121833;
  color: #f3f5ff;
  border: 1px solid var(--guide);
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.9rem;
    gap: 0.7rem;
  }
`;

const portraitClass = css`
  width: 4.6rem;
  height: 4.6rem;
  flex-shrink: 0;
  border-radius: 50%;
  object-fit: cover;
  object-position: top;
  background: var(--guide-soft);
  border: 2px solid var(--guide);
  @media (max-width: ${mobileMaxWidth}) {
    width: 3.8rem;
    height: 3.8rem;
  }
`;

const bodyClass = css`
  flex: 1;
  min-width: 0;
`;

const nameClass = css`
  display: inline-block;
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--guide);
  margin-bottom: 0.2rem;
`;

const ownActionsClass = css`
  display: flex;
  justify-content: space-between;
  gap: 0.6rem;
  margin-top: 0.8rem;
`;
