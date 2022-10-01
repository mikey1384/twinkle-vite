import PropTypes from 'prop-types';
import ChoiceList from './ChoiceList';
import { borderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

QuestionSlide.propTypes = {
  answerIndex: PropTypes.number,
  question: PropTypes.string.isRequired,
  selectedChoiceIndex: PropTypes.number,
  choices: PropTypes.array.isRequired,
  onCorrectAnswer: PropTypes.func.isRequired
};

export default function QuestionSlide({
  answerIndex,
  question,
  selectedChoiceIndex,
  choices,
  onCorrectAnswer
}) {
  return (
    <div
      className={css`
        width: 100%;
        padding: 0 1rem 3rem 1rem;
        border-radius: ${borderRadius};
        @media (max-width: ${mobileMaxWidth}) {
          padding-bottom: 1rem;
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
            justify-content: center;
            margin-top: 2rem;
            text-align: center;
            align-items: center;
            .jiggle {
              animation: jiggle 100ms ease-in-out;
            }
            @media (max-width: ${mobileMaxWidth}) {
              > h3 {
                font-size: 1.8rem;
              }
            }
          `}
        >
          <h3>{question}</h3>
          <ChoiceList
            style={{ marginTop: '3rem', fontSize: '1.6rem' }}
            answerIndex={answerIndex}
            selectedChoiceIndex={selectedChoiceIndex}
            onCorrectAnswer={onCorrectAnswer}
            listItems={choices}
          />
        </div>
      </div>
    </div>
  );
}
