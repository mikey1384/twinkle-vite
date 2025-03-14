import React, { useEffect, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import ContentPreview from './ContentPreview';
import Loading from '~/components/Loading';
import Icon from '~/components/Icon';
import { useAppContext, useKeyContext, useHomeContext } from '~/contexts';

const BodyRef = document.scrollingElement || document.documentElement;

export default function RewardPosts() {
  const {
    showMeAnotherPostButton: { color: showMeAnotherPostButtonColor }
  } = useKeyContext((v) => v.theme);
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
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <p>Earn Karma Points by Rewarding Posts</p>
        <div
          style={{
            marginTop: '1.5rem'
          }}
        >
          {loading ? (
            <Loading style={{ height: '20rem' }} />
          ) : posts.length === 0 ? (
            <div
              style={{
                height: '17rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: '2rem'
              }}
            >{`Wow, it looks like there aren't any posts left to reward!`}</div>
          ) : (
            <>
              {posts.map(
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
                }) => (
                  <ContentPreview key={post.id} contentObj={post} />
                )
              )}
            </>
          )}
        </div>
        {posts.length > 0 && (
          <div
            style={{
              marginTop: '1.5rem',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '3rem'
            }}
          >
            <Button
              filled
              color={showMeAnotherPostButtonColor}
              onClick={handleLoadAnotherPostClick}
              disabled={skipping || loading}
            >
              <Icon icon="redo" />
              <span style={{ marginLeft: '0.7rem' }}>Show me another post</span>
            </Button>
          </div>
        )}
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <Button
            onClick={() => handleSetTopMenuSection('subject')}
            style={{ width: '50%' }}
            filled
            color="logoBlue"
          >
            <Icon icon="certificate" />
            <span style={{ marginLeft: '0.7rem' }}>Answer subjects</span>
          </Button>
          <Button
            onClick={() => handleSetTopMenuSection('recommend')}
            style={{ marginLeft: '1rem', width: '50%' }}
            filled
            color="brownOrange"
          >
            <Icon icon="heart" />
            <span style={{ marginLeft: '0.7rem' }}>Recommend posts</span>
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
