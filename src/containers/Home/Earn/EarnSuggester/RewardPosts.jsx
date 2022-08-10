import { useEffect, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import CommentPreview from './CommentPreview';
import Loading from '~/components/Loading';
import Icon from '~/components/Icon';
import { useAppContext, useHomeContext } from '~/contexts';

const BodyRef = document.scrollingElement || document.documentElement;

export default function StartMenu() {
  const onSetEarnSection = useHomeContext((v) => v.actions.onSetEarnSection);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const loadPostsToReward = useAppContext(
    (v) => v.requestHelpers.loadPostsToReward
  );

  useEffect(() => {
    handleLoadPostsToReward();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary componentPath="Home/Earn/EarnSuggester/RewardPosts">
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
            >{`Wow, it looks like there aren't any post left to reward!`}</div>
          ) : (
            <>
              {posts.map((post) => (
                <CommentPreview key={post.id} contentObj={post} />
              ))}
            </>
          )}
        </div>
        <div
          style={{
            marginTop: '5rem',
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
              onClick={() => handleSetEarnSection('recommend')}
              style={{ marginTop: '0.7rem' }}
              filled
              color="brownOrange"
            >
              <Icon icon="heart" />
              <span style={{ marginLeft: '0.7rem' }}>Recommend posts</span>
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

  async function handleLoadPostsToReward() {
    setLoading(true);
    const data = await loadPostsToReward();
    setPosts(data);
    setLoading(false);
  }
}
