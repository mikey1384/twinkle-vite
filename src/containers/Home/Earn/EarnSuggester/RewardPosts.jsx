import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import GradientButton from '~/components/Buttons/GradientButton';
import CommentPreview from './CommentPreview';
import Loading from '~/components/Loading';
import Icon from '~/components/Icon';
import { useAppContext, useKeyContext, useHomeContext } from '~/contexts';

const BodyRef = document.scrollingElement || document.documentElement;

RewardPosts.propTypes = {
  onSetGrammarGameModalShown: PropTypes.func.isRequired
};

export default function RewardPosts({ onSetGrammarGameModalShown }) {
  const {
    showMeAnotherPostButton: { color: showMeAnotherPostButtonColor }
  } = useKeyContext((v) => v.theme);
  const onSetEarnSection = useHomeContext((v) => v.actions.onSetEarnSection);
  const [posts, setPosts] = useState([]);
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
            <GradientButton
              style={{ marginTop: '0.7rem' }}
              fontSize="1.5rem"
              mobileFontSize="1.3rem"
              onClick={() => onSetGrammarGameModalShown(true)}
            >
              <Icon icon="spell-check" />
              <span style={{ marginLeft: '0.7rem' }}>The Grammar Game</span>
            </GradientButton>
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

  async function handleLoadAnotherPostClick() {
    if (posts[0]?.id) {
      setSkipping(true);
      await markPostAsSkipped({
        earnType: 'karma',
        action: 'reward',
        contentType: 'comment',
        contentId: posts[0].id
      });
      setSkipping(false);
    }
    document.getElementById('App').scrollTop = 0;
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
