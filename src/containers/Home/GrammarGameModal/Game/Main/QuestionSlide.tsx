import React from 'react';
import ChoiceList from './ChoiceList';
import { borderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { WEBSITE_AGENT_OFF_LIMITS_ATTRIBUTE } from '~/helpers/websiteAgentPage';
import { NEON, READ_FONT, rgba } from '../../ClassicArcade/theme';

export default function QuestionSlide({
  answerIndex,
  isCompleted,
  question,
  selectedChoiceIndex,
  pendingChoiceIndex,
  choices,
  onSelect,
  gotWrong,
  onCountdownStart
}: {
  // Unknown until the server confirms a right pick.
  answerIndex?: number;
  isCompleted?: boolean;
  question: string;
  selectedChoiceIndex: number;
  pendingChoiceIndex: number | null;
  choices: any[];
  onSelect: (choiceIndex: number) => void;
  gotWrong: boolean;
  onCountdownStart?: () => void;
}) {
  return (
    <div
      // The user's to answer alone: never read by Zero or Ciel.
      {...{ [WEBSITE_AGENT_OFF_LIMITS_ATTRIBUTE]: 'grammarblesPlay' }}
      className={css`
        width: 100%;
        padding: 0 1rem 3rem 1rem;
        border-radius: ${borderRadius};
        @media (max-width: ${mobileMaxWidth}) {
          padding-bottom: 1rem;
        }
        @media (max-height: 520px) and (orientation: landscape) {
          padding-bottom: 0.4rem;
        }
      `}
    >
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div
          className={css`
            width: 100%;
            min-height: 25rem;
            display: flex;
            flex-direction: column;
            margin-top: 2rem;
            /* centred only while there is room: these spacers shrink to 0
               when the content is taller, so the top is never pushed out */
            &::before,
            &::after {
              content: '';
              flex: 1 1 0;
            }
            @media (max-height: 760px) {
              min-height: 0;
              margin-top: 1rem;
            }
            text-align: center;
            align-items: center;
            .jiggle-jiggle-jiggle {
              animation: jiggle-jiggle-jiggle linear;
              animation-duration: 1000ms;
            }
            .question-card {
              position: relative;
              width: 100%;
              max-width: 64rem;
              padding: 2.2rem 2.4rem;
              border-radius: 18px;
              background: linear-gradient(
                180deg,
                rgba(22, 28, 92, 0.78) 0%,
                rgba(10, 12, 50, 0.86) 100%
              );
              border: 1px solid ${rgba(NEON.cyanRgb, 0.45)};
              box-shadow:
                0 0 0 1px ${rgba(NEON.violetRgb, 0.25)},
                0 0 26px ${rgba(NEON.cyanRgb, 0.2)},
                inset 0 1px 0 rgba(255, 255, 255, 0.12),
                inset 0 0 30px rgba(0, 0, 0, 0.35);
            }
            .question-card > h3 {
              margin: 0;
              font-family: ${READ_FONT};
              font-size: 2.3rem;
              font-weight: 800;
              line-height: 1.5;
              color: #ffffff;
              text-shadow: 0 2px 0 rgba(5, 8, 36, 0.6);
              overflow-wrap: anywhere;
            }
            @media (max-width: ${mobileMaxWidth}) {
              .question-card {
                padding: 1.5rem 1.3rem;
                border-radius: 14px;
              }
              .question-card > h3 {
                font-size: 1.9rem;
              }
            }
            /* phones on their side: a slim question card */
            @media (max-height: 520px) and (orientation: landscape) {
              margin-top: 0.3rem;
              .question-card {
                padding: 0.8rem 1.1rem;
                margin-bottom: 0.6rem;
              }
              .question-card > h3 {
                font-size: 1.6rem;
                line-height: 1.35;
              }
            }
          `}
        >
          <div className="question-card">
            <h3 className="unselectable">{question}</h3>
          </div>
          <ChoiceList
            style={{ marginTop: '2.5rem', fontSize: '1.8rem' }}
            answerIndex={answerIndex}
            isCompleted={isCompleted}
            selectedChoiceIndex={selectedChoiceIndex}
            pendingChoiceIndex={pendingChoiceIndex}
            onSelect={onSelect}
            listItems={choices || []}
            questionLength={(question || '').length}
            gotWrong={gotWrong}
            onShown={onCountdownStart}
          />
        </div>
      </div>
    </div>
  );
}
