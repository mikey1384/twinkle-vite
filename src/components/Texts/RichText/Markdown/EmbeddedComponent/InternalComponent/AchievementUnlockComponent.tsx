import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { useContentState } from '~/helpers/hooks';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import AchievementItem from '~/components/AchievementItem';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import Loading from '~/components/Loading';
import InvalidContent from '../InvalidContent';
import { timeSince } from '~/helpers/timeStampHelpers';
import { isMobile } from '~/helpers';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { addCommasToNumber } from '~/helpers/stringHelpers';

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

  if (isPreview) {
    return (
      <button
        type="button"
        className={compactAchievementUnlockClass}
        onClick={handlePreviewClick}
      >
        <div className="compact-achievement-unlock__badge">
          <AchievementItem
            isSmall
            isThumb
            achievement={rootObj}
            thumbSize="5.8rem"
          />
        </div>
        <div className="compact-achievement-unlock__copy">
          <span className="compact-achievement-unlock__chip">
            <Icon icon="certificate" />
            Achievement
          </span>
          <strong>
            {rootObj.title || 'Achievement'}
            {rootObj.ap ? (
              <span>({addCommasToNumber(Number(rootObj.ap))} AP)</span>
            ) : null}
          </strong>
          {rootObj.description ? <p>{rootObj.description}</p> : null}
        </div>
      </button>
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

const compactAchievementUnlockClass = css`
  appearance: none;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(6.2rem, 28%) minmax(0, 1fr);
  align-items: center;
  gap: 0.8rem;
  width: 100%;
  height: 100%;
  min-height: 10.5rem;
  padding: 0.85rem;
  overflow: hidden;
  border: 1px solid ${Color.borderGray()};
  border-left: 0.35rem solid ${Color.gold()};
  border-radius: ${borderRadius};
  background: #fff;
  color: ${Color.darkerGray()};
  font: inherit;
  text-align: left;
  cursor: pointer;
  .compact-achievement-unlock__badge {
    display: flex;
    min-width: 0;
    align-items: center;
    justify-content: center;
  }
  .compact-achievement-unlock__badge > div {
    padding: 0;
  }
  .compact-achievement-unlock__copy {
    display: flex;
    min-width: 0;
    flex-direction: column;
    justify-content: center;
    gap: 0.42rem;
  }
  .compact-achievement-unlock__chip {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    gap: 0.38rem;
    min-height: 1.9rem;
    padding: 0.32rem 0.58rem;
    border: 1px solid ${Color.gold(0.36)};
    border-radius: 999px;
    background: ${Color.gold(0.14)};
    color: ${Color.gold()};
    font-size: 1.05rem;
    font-weight: 850;
    line-height: 1;
    white-space: nowrap;
  }
  strong {
    overflow: hidden;
    color: ${Color.black()};
    font-size: max(1.9rem, 19px);
    font-weight: 850;
    line-height: 1.18;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  strong span {
    margin-left: 0.38rem;
    color: ${Color.darkGray()};
    font-size: 1.12rem;
    font-weight: 700;
  }
  p {
    margin: 0;
    overflow: hidden;
    color: ${Color.darkGray()};
    font-size: max(1.8rem, 18px);
    font-weight: 400;
    line-height: 1.34;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
`;
