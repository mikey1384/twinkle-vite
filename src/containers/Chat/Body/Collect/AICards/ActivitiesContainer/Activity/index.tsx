import React, { useEffect, useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import SummonActivity from './SummonActivity';
import OfferActivity from './OfferActivity';
import { useAppContext, useChatContext } from '~/contexts';
import { useNavigate } from 'react-router-dom';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import TransferActivity from './TransferActivity';
import LoadingPlaceholder from '~/components/LoadingPlaceholder';

export default function Activity({
  isLastActivity,
  cardObj,
  feed,
  myId,
  myUsername,
  onReceiveNewActivity,
  onSetScrollToBottom
}: {
  isLastActivity: boolean;
  cardObj: any;
  feed: any;
  myId: number;
  myUsername: string;
  onReceiveNewActivity: () => void;
  onSetScrollToBottom: () => void;
}) {
  const loadAICardFeed = useAppContext((v) => v.requestHelpers.loadAICardFeed);
  const onLoadAICardFeed = useChatContext((v) => v.actions.onLoadAICardFeed);
  const [usermenuShown, setUsermenuShown] = useState(false);
  const navigate = useNavigate();
  const card = useMemo(() => {
    if (feed?.type === 'summon') {
      return cardObj[feed?.contentId];
    }
    if (feed?.type === 'offer') {
      return cardObj[feed?.offer?.cardId];
    }
    if (feed?.type === 'transfer') {
      return cardObj[feed?.transfer?.cardId];
    }
    return null;
  }, [
    cardObj,
    feed?.contentId,
    feed?.offer?.cardId,
    feed?.transfer?.cardId,
    feed?.type
  ]);

  useEffect(() => {
    init();
    async function init() {
      if (!feed?.isLoaded) {
        let retryCount = 0;
        const maxRetries = 5;
        while (retryCount < maxRetries) {
          try {
            const loadedFeed = await loadAICardFeed({ feedId: feed?.id });
            onLoadAICardFeed({ feed: loadedFeed });
            break;
          } catch (error) {
            retryCount++;
            if (retryCount === maxRetries) {
              console.error(
                'Failed to load AI card feed after max retries:',
                error
              );
              break;
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feed?.isLoaded]);

  if (!feed?.isLoaded || !card) {
    return (
      <LoadingPlaceholder
        height={feed.type === 'summon' ? 'clamp(20vw, 46vh, 42vw)' : '4rem'}
        mobileHeight={
          feed.type === 'summon' ? 'clamp(30vw, 25vh, 50vw)' : '4rem'
        }
      />
    );
  }

  return (
    <ErrorBoundary componentPath="Chat/Body/Collect/AICards/ActivitiesContainer/Activity">
      <div
        style={{
          width: '100%',
          padding: '2rem 1rem',
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'column',
          marginBottom: isLastActivity ? '5rem' : '2rem'
        }}
        className={css`
          cursor: ${feed.type !== 'summon' ? 'pointer' : 'default'};
          background: ${Color.whiteGray()};
          &:hover {
            background: ${feed.type !== 'summon'
              ? Color.highlightGray()
              : Color.whiteGray()};
          }
        `}
        onClick={handleActivityClick}
      >
        {feed.type === 'summon' && (
          <SummonActivity
            card={card}
            isLastActivity={isLastActivity}
            myId={myId}
            onReceiveNewActivity={onReceiveNewActivity}
            onSetScrollToBottom={onSetScrollToBottom}
          />
        )}
        {feed.type === 'offer' && (
          <OfferActivity
            feed={feed}
            card={card}
            myId={myId}
            onSetUsermenuShown={setUsermenuShown}
            isLastActivity={isLastActivity}
            onReceiveNewActivity={onReceiveNewActivity}
          />
        )}
        {feed.type === 'transfer' && (
          <TransferActivity
            feed={feed}
            card={card}
            myId={myId}
            myUsername={myUsername}
            onSetUsermenuShown={setUsermenuShown}
            isLastActivity={isLastActivity}
            onReceiveNewActivity={onReceiveNewActivity}
          />
        )}
      </div>
    </ErrorBoundary>
  );

  function handleActivityClick() {
    if (usermenuShown) {
      return;
    }
    if (feed.type === 'offer') {
      navigate(`./?cardId=${feed.offer.cardId}`);
    }
    if (feed.type === 'transfer') {
      navigate(`./?cardId=${feed.transfer.cardId}`);
    }
  }
}
