import { useEffect, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import CommentPreview from './CommentPreview';
import Loading from '~/components/Loading';
import Icon from '~/components/Icon';
import { useKeyContext, useAppContext, useHomeContext } from '~/contexts';

export default function StartMenu() {
  const {
    showMeAnotherPostButton: { color: showMeAnotherPostButtonColor }
  } = useKeyContext((v) => v.theme);
  const onSetEarnSection = useHomeContext((v) => v.actions.onSetEarnSection);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const loadPostsToRecommend = useAppContext(
    (v) => v.requestHelpers.loadPostsToRecommend
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
        <div style={{ marginTop: '1.5rem' }}>
          {loading ? (
            <Loading />
          ) : (
            <>
              {posts.map((subject) => (
                <CommentPreview key={subject.id} contentObj={subject} />
              ))}
            </>
          )}
        </div>
        <div
          style={{
            marginTop: '1.5rem',
            width: '100%',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <Button
            filled
            color={showMeAnotherPostButtonColor}
            onClick={handleLoadPostsToRecommend}
          >
            <Icon icon="redo" />
            <span style={{ marginLeft: '0.7rem' }}>Show me another post</span>
          </Button>
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
              onClick={() => onSetEarnSection('subject')}
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
              onClick={() => onSetEarnSection('reward')}
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

  async function handleLoadPostsToRecommend() {
    setLoading(true);
    const data = await loadPostsToRecommend();
    setPosts(data);
    setLoading(false);
  }
}
