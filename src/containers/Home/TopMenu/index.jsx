import { useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import InputPanel from './InputPanel';
import {
  GENERAL_CHAT_ID,
  GENERAL_CHAT_PATH_ID
} from '~/constants/defaultValues';
import { useChatContext, useHomeContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { useNavigate } from 'react-router-dom';
import localize from '~/constants/localize';
import TopButton from './TopButton';

const grammarGameLabel = localize('grammarGame');

TopMenu.propTypes = {
  isEarnPage: PropTypes.bool,
  onAnswerSubjectsButtonClick: PropTypes.func,
  onEarnKarmaButtonClick: PropTypes.func,
  onInputModalButtonClick: PropTypes.func.isRequired,
  onPlayGrammarGame: PropTypes.func.isRequired,
  style: PropTypes.object
};

export default function TopMenu({
  onAnswerSubjectsButtonClick,
  onEarnKarmaButtonClick,
  onInputModalButtonClick,
  onPlayGrammarGame,
  style,
  isEarnPage
}) {
  const navigate = useNavigate();
  const topMenuSection = useHomeContext((v) => v.state.topMenuSection);
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );
  const onSetWordleModalShown = useChatContext(
    (v) => v.actions.onSetWordleModalShown
  );
  const [loadingChat, setLoadingChat] = useState(false);
  const { userId, username } = useKeyContext((v) => v.myState);
  return userId ? (
    <ErrorBoundary componentPath="Home/Stories/TopMenu">
      <div
        style={{ marginBottom: '1rem', ...style }}
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
          <TopButton
            colorLeft={Color.purple()}
            colorMiddle={Color.redOrange()}
            colorRight={Color.rose()}
            onClick={onPlayGrammarGame}
          >
            {grammarGameLabel}
          </TopButton>
          {isEarnPage && (
            <TopButton
              colorLeft={Color.passionFruit()}
              colorMiddle={Color.passionFruit()}
              colorRight={Color.lightOrange()}
              style={{ marginLeft: '1rem' }}
              onClick={() => navigate('/')}
            >
              Read Posts
            </TopButton>
          )}
          {!(isEarnPage && topMenuSection === 'subject') && (
            <TopButton
              colorLeft={Color.logoBlue()}
              colorMiddle={Color.logoBlue()}
              colorRight={Color.lightBlue()}
              style={{ marginLeft: '1rem' }}
              onClick={onAnswerSubjectsButtonClick}
            >
              Answer Subjects
            </TopButton>
          )}
          {!(isEarnPage && topMenuSection === 'karma') && (
            <TopButton
              colorLeft={Color.strongPink()}
              colorMiddle={Color.strongPink()}
              colorRight={Color.pastelPink()}
              style={{ marginLeft: '1rem' }}
              onClick={onEarnKarmaButtonClick}
            >
              Earn KP
            </TopButton>
          )}
          <TopButton
            disabled={loadingChat}
            colorLeft={Color.orange()}
            colorMiddle={Color.gold()}
            colorRight={Color.magenta()}
            style={{ marginLeft: '1rem' }}
            onClick={handleWordleButtonClick}
          >
            Wordle
          </TopButton>
        </div>
      </div>
    </ErrorBoundary>
  ) : null;

  function handleWordleButtonClick() {
    setLoadingChat(true);
    onUpdateSelectedChannelId(GENERAL_CHAT_ID);
    return setTimeout(() => {
      navigate(`/chat/${GENERAL_CHAT_PATH_ID}`);
      setTimeout(() => {
        onSetWordleModalShown(true);
      }, 10);
    }, 10);
  }
}
