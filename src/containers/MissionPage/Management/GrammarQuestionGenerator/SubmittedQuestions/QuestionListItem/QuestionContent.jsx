import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';

QuestionContent.propTypes = {
  correctChoice: PropTypes.string.isRequired,
  question: PropTypes.object.isRequired,
  wrongChoices: PropTypes.array.isRequired
};

export default function QuestionContent({
  question,
  correctChoice,
  wrongChoices
}) {
  return (
    <ErrorBoundary componentPath="GrammarQuestionGenerator/SubmittedQuestions/QuestionListItem/QuestionContent">
      <div style={{ width: '100%', textAlign: 'center' }}>
        <p style={{ fontSize: '2.2rem', fontWeight: 'bold' }}>
          {question.question}
        </p>
      </div>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div
          className={css`
            > article {
              text-align: center;
              font-weight: bold;
              font-size: 1.9rem;
            }
            p {
              font-size: 1.7rem;
            }
          `}
          style={{ marginTop: '3rem' }}
        >
          <article>Correct Choice</article>
          <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
            <p>{correctChoice}</p>
          </div>
          <article style={{ marginTop: '3rem' }}>Wrong Choices</article>
          <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
            {wrongChoices.map((choice, index) => (
              <p key={index}>{choice}</p>
            ))}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
