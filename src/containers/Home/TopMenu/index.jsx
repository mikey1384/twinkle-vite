import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import InputPanel from './InputPanel';
import { useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';

TopMenu.propTypes = {
  onAnswerSubjectsButtonClick: PropTypes.func,
  onEarnKarmaButtonClick: PropTypes.func,
  onInputModalButtonClick: PropTypes.func.isRequired,
  onPlayGrammarGame: PropTypes.func.isRequired
};

export default function TopMenu({
  onAnswerSubjectsButtonClick,
  onEarnKarmaButtonClick,
  onInputModalButtonClick,
  onPlayGrammarGame
}) {
  const { username } = useKeyContext((v) => v.myState);
  return username ? (
    <ErrorBoundary componentPath="Home/Stories/TopMenu">
      <div
        style={{ marginBottom: '1rem' }}
        className={css`
          background: #fff;
          font-size: 1.7rem;
          padding: 1rem;
          border: 1px solid ${Color.borderGray()};
          border-radius: ${borderRadius};
          p {
            font-size: 2rem;
            font-weight: bold;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.7rem;
            }
          }
          @media (max-width: ${mobileMaxWidth}) {
            border-radius: 0;
            border-top: 0;
            border-left: 0;
            border-right: 0;
          }
        `}
      >
        <p
          className={css`
            color: ${Color.darkerGray()};
          `}
        >
          Hi, {username}! What do you want to do today?
        </p>
        <InputPanel onInputModalButtonClick={onInputModalButtonClick} />
        <div
          className={css`
            margin-top: 1.5rem;
            display: flex;
          `}
        >
          <div className={buttonStyle} onClick={onPlayGrammarGame}>
            Play Grammar Game
          </div>
          <div
            style={{ marginLeft: '1rem' }}
            onClick={onAnswerSubjectsButtonClick}
            className={buttonStyle}
          >
            Answer Subjects
          </div>
          <div
            style={{ marginLeft: '1rem' }}
            onClick={onEarnKarmaButtonClick}
            className={buttonStyle}
          >
            Earn Karma Points
          </div>
        </div>
      </div>
    </ErrorBoundary>
  ) : null;
}

const buttonStyle = css`
  cursor: pointer;
  text-align: center;
  font-weight: bold;
  background: #fff;
  font-size: 1.5rem;
  border-radius: ${borderRadius};
  border: 1px solid ${Color.borderGray()};
  padding: 1rem;
`;
