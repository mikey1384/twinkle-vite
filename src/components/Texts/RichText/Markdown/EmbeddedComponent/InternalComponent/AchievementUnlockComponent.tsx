import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { useContentState } from '~/helpers/hooks';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import AchievementItem from '~/components/AchievementItem';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import Loading from '~/components/Loading';
import InvalidContent from '../InvalidContent';
import { timeSince } from '~/helpers/timeStampHelpers';
import { isMobile } from '~/helpers';
import { useRoleColor } from '~/theme/useRoleColor';

const displayIsMobile = isMobile(navigator);

export default function AchievementUnlockComponent({ src }: { src: string }) {
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const [hasError, setHasError] = useState(false);
  const loadingRef = useRef(false);

  const linkRole = useRoleColor('link', { fallback: 'logoBlue' });
  const linkColor = linkRole.getColor();

  const passId = useMemo(() => {
    const parts = src.split('/');
    return parts[2]?.split('?')?.[0];
  }, [src]);

  const contentState = useContentState({
    contentType: 'pass',
    contentId: Number(passId)
  });

  const { loaded, uploader, rootObj, rootType, timeStamp } = contentState;
  const loadContent = useAppContext((v) => v.requestHelpers.loadContent);
  const onInitContent = useContentContext((v) => v.actions.onInitContent);

  useEffect(() => {
    if (!loaded && !loadingRef.current && !isNaN(Number(passId))) {
      onMount();
    }
    async function onMount() {
      try {
        loadingRef.current = true;
        const data = await loadContent({
          contentId: Number(passId),
          contentType: 'pass',
          rootType: 'achievement'
        });
        if (data.notFound) {
          return setHasError(true);
        }
        onInitContent({
          ...data,
          contentType: 'pass',
          contentId: Number(passId)
        });
      } catch (_error) {
        setHasError(true);
      } finally {
        loadingRef.current = false;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, passId, userId]);

  if (hasError || isNaN(Number(passId))) {
    return <InvalidContent />;
  }

  if (!loaded) {
    return <Loading />;
  }

  if (rootType !== 'achievement' || !rootObj) {
    return <InvalidContent />;
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
}
