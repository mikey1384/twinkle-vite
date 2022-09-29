import PropTypes from 'prop-types';
import ChoiceList from './ChoiceList';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

QuestionSlide.propTypes = {
  answerIndex: PropTypes.number,
  conditionPassStatus: PropTypes.string,
  gotWrong: PropTypes.bool,
  question: PropTypes.string.isRequired,
  choices: PropTypes.array.isRequired,
  onSelectChoice: PropTypes.func.isRequired
};

export default function QuestionSlide({
  answerIndex,
  conditionPassStatus,
  gotWrong,
  question,
  choices,
  onSelectChoice
}) {
  return (
    <div
      className={css`
        width: 100%;
        padding: 2rem 1rem 3rem 1rem;
        border-radius: ${borderRadius};
        @media (max-width: ${mobileMaxWidth}) {
          padding-bottom: 1rem;
        }
      `}
    >
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div
          className={css`
            width: 80%;
            display: flex;
            flex-direction: column;
            margin-top: 3rem;
            @media (max-width: ${mobileMaxWidth}) {
              > h3 {
                font-size: 1.8rem;
              }
            }
          `}
        >
          {gotWrong && conditionPassStatus !== 'complete' && (
            <div
              style={{
                marginTop: '-1rem',
                marginBottom: '1rem',
                fontWeight: conditionPassStatus === 'pass' ? 'bold' : 'normal',
                color:
                  conditionPassStatus === 'pass'
                    ? Color.green()
                    : Color.orange()
              }}
            >
              {conditionPassStatus === 'pass'
                ? [
                    'You did it!',
                    'Great job!',
                    'Excellent!',
                    'Bravo!',
                    'You are getting better at this!'
                  ].sort(() => Math.random() - 0.5)[0]
                : 'You got this wrong last time'}
            </div>
          )}
          <h3>{question}</h3>
          <ChoiceList
            style={{ marginTop: '2rem', fontSize: '1.6rem' }}
            answerIndex={answerIndex}
            conditionPassStatus={conditionPassStatus}
            onSelect={onSelectChoice}
            listItems={choices}
          />
        </div>
      </div>
    </div>
  );
}
