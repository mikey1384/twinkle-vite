import { useEffect, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import CommentPreview from './CommentPreview';
import Loading from '~/components/Loading';
import Icon from '~/components/Icon';
import { useKeyContext, useAppContext, useHomeContext } from '~/contexts';

const BodyRef = document.scrollingElement || document.documentElement;

export default function StartMenu() {
  const {
    showMeAnotherPostButton: { color: showMeAnotherPostButtonColor }
  } = useKeyContext((v) => v.theme);
  const onSetEarnSection = useHomeContext((v) => v.actions.onSetEarnSection);
  const [posts, setPosts] = useState([]);
  const [skipping, setSkipping] = useState(false);
  const [loading, setLoading] = useState(false);
  const loadPostsToRecommend = useAppContext(
    (v) => v.requestHelpers.loadPostsToRecommend
  );
  const markPostAsSkipped = useAppContext(
    (v) => v.requestHelpers.markPostAsSkipped
  );

  useEffect(() => {
    handleLoadPostsToRecommend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary componentPath="Home/Earn/EarnSuggester/RecommendPosts">
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <p>Earn Karma Points by Recommending Posts</p>
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
            >{`Wow, it looks like there aren't any post left to recommend!`}</div>
          ) : (
            <>
              {posts.map((post) => (
                <CommentPreview key={post.id} contentObj={post} />
              ))}
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
              marginBottom: '5rem'
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
          <div
            style={{ display: 'flex', flexDirection: 'column', width: '80%' }}
          >
            <p>Earn XP</p>
            <Button
              onClick={() => handleSetEarnSection('subject')}
              style={{ marginTop: '0.7rem' }}
              filled
              color="logoBlue"
            >
              <Icon icon="bolt" />
              <span style={{ marginLeft: '0.7rem' }}>
                Respond to high XP subjects
              </span>
            </Button>
            <p style={{ marginTop: '1.5rem' }}>Earn Karma Points</p>
            <Button
              onClick={() => handleSetEarnSection('reward')}
              style={{ marginTop: '0.7rem' }}
              filled
              color="pink"
            >
              <Icon icon="certificate" />
              <span style={{ marginLeft: '0.7rem' }}>Reward posts</span>
            </Button>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );

  function handleSetEarnSection(section) {
    onSetEarnSection(section);
    document.getElementById('App').scrollTop = 0;
    BodyRef.scrollTop = 0;
  }

  async function handleLoadAnotherPostClick() {
    if (posts[0]?.id) {
      setSkipping(true);
      await markPostAsSkipped({
        earnType: 'karma',
        action: 'recommendation',
        contentType: 'comment',
        contentId: posts[0].id
      });
      setSkipping(false);
    }
    document.getElementById('App').scrollTop = 0;
    BodyRef.scrollTop = 0;
    handleLoadPostsToRecommend();
  }

  async function handleLoadPostsToRecommend() {
    setLoading(true);
    const data = await loadPostsToRecommend();
    setPosts(data);
    setLoading(false);
  }
}
