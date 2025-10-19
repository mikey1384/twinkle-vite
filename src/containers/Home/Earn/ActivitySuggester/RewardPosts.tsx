import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import ContentPreview from './ContentPreview';
import Loading from '~/components/Loading';
import Icon from '~/components/Icon';
import { useAppContext, useHomeContext } from '~/contexts';
import { Color, wideBorderRadius } from '~/constants/css';
import { useRoleColor } from '~/theme/useRoleColor';

const BodyRef = document.scrollingElement || document.documentElement;

export default function RewardPosts() {
  const showAnotherPostRole = useRoleColor('showMeAnotherPostButton', {
    fallback: 'green'
  });
  const showMeAnotherPostButtonColor = showAnotherPostRole.colorKey;
  const onSetTopMenuSectionSection = useHomeContext(
    (v) => v.actions.onSetTopMenuSectionSection
  );
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const loadPostsToReward = useAppContext(
    (v) => v.requestHelpers.loadPostsToReward
  );
  const markPostAsSkipped = useAppContext(
    (v) => v.requestHelpers.markPostAsSkipped
  );

  useEffect(() => {
    handleLoadPostsToReward();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary componentPath="Home/Earn/ActivitySuggester/RewardPosts">
      <div className={sectionContainer}>
        <h3 className={sectionHeading}>
          Earn Karma Points by Rewarding Posts
        </h3>
        <div className={listContainer}>
          {loading ? (
            <Loading style={{ height: '20rem' }} />
          ) : posts.length === 0 ? (
            <div className={emptyState}>
              Wow, it looks like there aren't any posts left to reward!
            </div>
          ) : (
            posts.map(
              (post: {
                id: number;
                contentType: string;
                content: string;
                story: string;
                uploader: {
                  id: number;
                  username: string;
                  profilePicUrl: string;
                };
              }) => <ContentPreview key={post.id} contentObj={post} />
            )
          )}
        </div>
        {posts.length > 0 && (
          <div className={primaryActionRow}>
            <Button
              filled
              color={showMeAnotherPostButtonColor}
              onClick={handleLoadAnotherPostClick}
              disabled={skipping || loading}
            >
              <Icon icon="redo" />
              <span style={{ marginLeft: '0.7rem' }}>
                Show me another post
              </span>
            </Button>
          </div>
        )}
        <div className={secondaryActionRow}>
          <Button
            onClick={() => handleSetTopMenuSection('subject')}
            color="logoBlue"
            variant="soft"
            tone="flat"
            stretch
          >
            <Icon icon="certificate" />
            <span>Answer Subjects</span>
          </Button>
          <Button
            onClick={() => handleSetTopMenuSection('recommend')}
            color="brownOrange"
            variant="soft"
            tone="flat"
            stretch
          >
            <Icon icon="heart" />
            <span>Recommend Posts</span>
          </Button>
        </div>
      </div>
    </ErrorBoundary>
  );

  function handleSetTopMenuSection(section: string) {
    onSetTopMenuSectionSection(section);
    const appElement = document.getElementById('App');
    if (appElement) {
      appElement.scrollTop = 0;
    }
    BodyRef.scrollTop = 0;
  }

  async function handleLoadAnotherPostClick() {
    if (posts[0]?.id) {
      setSkipping(true);
      await markPostAsSkipped({
        earnType: 'karma',
        action: 'reward',
        contentType: posts[0].contentType,
        contentId: posts[0].id
      });
      setSkipping(false);
    }
    const appElement = document.getElementById('App');
    if (appElement) {
      appElement.scrollTop = 0;
    }
    BodyRef.scrollTop = 0;
    handleLoadPostsToReward();
  }

  async function handleLoadPostsToReward() {
    setLoading(true);
    const data = await loadPostsToReward();
    setPosts(data);
    setLoading(false);
  }
}

const sectionContainer = css`
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  width: 100%;
`;

const sectionHeading = css`
  margin: 0;
  font-size: 2.1rem;
  font-weight: 700;
  color: var(--home-panel-heading, ${Color.darkerGray()});
`;

const listContainer = css`
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
`;

const emptyState = css`
  height: 17rem;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  border-radius: ${wideBorderRadius};
  border: 1px dashed rgba(148, 163, 184, 0.45);
  color: rgba(15, 23, 42, 0.68);
  padding: 1.6rem;
  background: rgba(255, 255, 255, 0.78);
`;

const primaryActionRow = css`
  display: flex;
  justify-content: center;
  margin-top: 1.6rem;
`;

const secondaryActionRow = css`
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  margin-top: 1.4rem;
`;
