import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import { useAppContext, useKeyContext } from '~/contexts';
import { borderRadius, mobileMaxWidth } from '~/constants/css';
import StoryCard from '~/containers/BridgeBuilderQuest/Story/StoryCard';
import type { StoryCardData } from '~/containers/BridgeBuilderQuest/Story/types';

// "The story we made": the member's live Bridge Builder stories. Nothing when
// there are none, or for visitors who aren't signed in (story pages are for
// signed-in members).
export default function BridgeStories({ profileId }: { profileId: number }) {
  const myId = useKeyContext((v) => v.myState.userId);
  const loadUserMeetupStories = useAppContext(
    (v) => v.requestHelpers.loadUserMeetupStories
  );
  const [stories, setStories] = useState<StoryCardData[]>([]);

  useEffect(() => {
    if (!myId || !profileId) {
      setStories([]);
      return;
    }
    let active = true;
    loadUserMeetupStories(profileId)
      .then((data: { stories: StoryCardData[] }) => {
        if (active) setStories(data.stories || []);
      })
      .catch(() => {
        if (active) setStories([]);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId, profileId]);

  if (!stories.length) return null;

  return (
    <ErrorBoundary componentPath="Profile/Body/Home/BridgeStories">
      <section
        className={css`
          margin-bottom: 1.5rem;
          padding: 2rem 2.2rem 2.2rem;
          border-radius: ${borderRadius};
          background: #2f6fd0;
          @media (max-width: ${mobileMaxWidth}) {
            border-radius: 0;
            padding: 1.6rem 1.2rem;
          }
        `}
      >
        <h2
          className={css`
            display: flex;
            align-items: center;
            gap: 0.8rem;
            margin: 0 0 1.4rem;
            font-size: 1.9rem;
            font-weight: 900;
            color: #fff;
          `}
        >
          <Icon icon="users" />
          {stories.length === 1 ? 'The story we made' : 'The stories we made'}
          <span
            className={css`
              font-size: 1.25rem;
              font-weight: 800;
              letter-spacing: 0.12em;
              text-transform: uppercase;
              opacity: 0.8;
            `}
          >
            · Bridge Builders
          </span>
        </h2>
        <div
          className={css`
            display: grid;
            grid-template-columns: ${stories.length === 1
              ? 'minmax(0, 1fr)'
              : 'repeat(2, minmax(0, 1fr))'};
            gap: 1.6rem;
            @media (max-width: ${mobileMaxWidth}) {
              grid-template-columns: minmax(0, 1fr);
            }
          `}
        >
          {stories.map((story) => (
            <StoryCard
              key={story.storyId}
              story={story}
              size={stories.length === 1 ? 'lg' : 'md'}
            />
          ))}
        </div>
      </section>
    </ErrorBoundary>
  );
}
