import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { useContentState } from '~/helpers/hooks';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import AchievementItem from '~/components/AchievementItem';
import CompactAchievementCard from './CompactAchievementCard';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import Loading from '~/components/Loading';
import InvalidContent from '../InvalidContent';
import EmbedLoadError from '../EmbedLoadError';
import { timeSince } from '~/helpers/timeStampHelpers';
import { isMobile } from '~/helpers';
import { useRoleColor } from '~/theme/hooks/useRoleColor';

const displayIsMobile = isMobile(navigator);

export default function AchievementUnlockComponent({
  src,
  isPreview
}: {
  src: string;
  isPreview?: boolean;
}) {
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const [requestState, setRequestState] = useState<{
    passId: string;
    userId: number;
    status: 'loading' | 'ready' | 'error' | 'notFound';
  } | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);

  const linkRole = useRoleColor('link', { fallback: 'logoBlue' });
  const linkColor = linkRole.getColor();

  const passId = useMemo(() => {
    return src.split(/[?#]/)[0].split('/')[2];
  }, [src]);
  const isValidPassId = Number.isSafeInteger(Number(passId)) && Number(passId) > 0;

  const contentState = useContentState({
    contentType: 'pass',
    contentId: Number(passId)
  });

  const { loaded, uploader, rootObj, rootType, timeStamp } = contentState;
  const loadContent = useAppContext((v) => v.requestHelpers.loadContent);
  const onInitContent = useContentContext((v) => v.actions.onInitContent);

  useEffect(() => {
    let cancelled = false;
    if (!loaded && isValidPassId) {
      onMount();
    }
    async function onMount() {
      setRequestState({ passId, userId, status: 'loading' });
      try {
        const data = await loadContent({
          contentId: Number(passId),
          contentType: 'pass',
          rootType: 'achievement'
        });
        if (cancelled) return;
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
          throw new Error('Achievement unlock is incomplete');
        }
        if (data.notFound) {
          setRequestState({ passId, userId, status: 'notFound' });
          return;
        }
        onInitContent({
          ...data,
          contentType: 'pass',
          contentId: Number(passId)
        });
        setRequestState({ passId, userId, status: 'ready' });
      } catch (_error) {
        if (!cancelled) setRequestState({ passId, userId, status: 'error' });
      }
    }
    return () => {
      cancelled = true;
    };
  }, [
    loaded,
    passId,
    userId,
    isValidPassId,
    retryAttempt,
    loadContent,
    onInitContent
  ]);

  if (!isValidPassId) {
    return <InvalidContent />;
  }

  if (!loaded) {
    const status =
      requestState?.passId === passId && requestState.userId === userId
        ? requestState.status
        : 'loading';
    if (status === 'notFound') return <InvalidContent />;
    if (status === 'error') {
      return (
        <EmbedLoadError onRetry={() => setRetryAttempt((value) => value + 1)} />
      );
    }
    return (
      <Loading text="Loading achievement" innerStyle={{ fontSize: '14px' }} />
    );
  }

  if (rootType !== 'achievement' || !rootObj) {
    return <InvalidContent />;
  }

  if (isPreview) {
    return (
      <CompactAchievementCard
        achievement={rootObj}
        onClick={handlePreviewClick}
      />
    );
  }

  return (
    <div
      className={css`
        cursor: pointer;
        background: #fff;
        border: 1px solid var(--ui-border);
        border-radius: ${borderRadius};
        padding: 1rem;
        min-width: ${displayIsMobile ? '100%' : '80%'};
        @media (max-width: ${mobileMaxWidth}) {
          border-radius: 0;
        }
      `}
      onClick={() => navigate(`/achievement-unlocks/${passId}`)}
    >
      <header
        className={css`
          display: flex;
          align-items: center;
          gap: 0.9rem;
          padding: 0.2rem 0.2rem 0.6rem 0.2rem;
          width: 100%;
        `}
      >
        <ProfilePic
          style={{ width: '3.8rem', flexShrink: 0 }}
          userId={uploader?.id}
          profilePicUrl={uploader?.profilePicUrl || ''}
        />
        <div
          className={css`
            flex: 1 1 auto;
            display: flex;
            flex-direction: column;
            gap: 0.2rem;
          `}
        >
          <span
            className={css`
              font-size: 1.6rem;
              font-weight: 600;
            `}
          >
            <span onClick={(e) => e.stopPropagation()}>
              <UsernameText user={uploader} color={linkColor} />
            </span>{' '}
            unlocked an achievement
          </span>
          {timeStamp && (
            <small
              className={css`
                font-size: 1.1rem;
                color: ${Color.gray()};
              `}
            >
              {timeSince(timeStamp)}
            </small>
          )}
        </div>
      </header>
      <div onClick={(e) => e.stopPropagation()}>
        <AchievementItem isNotification achievement={rootObj} />
      </div>
    </div>
  );

  function handlePreviewClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    navigate(`/achievement-unlocks/${passId}`);
  }
}
