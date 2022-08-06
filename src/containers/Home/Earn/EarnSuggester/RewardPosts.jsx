import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useHomeContext } from '~/contexts';

export default function StartMenu() {
  const onSetEarnSection = useHomeContext((v) => v.actions.onSetEarnSection);

  return (
    <ErrorBoundary componentPath="Home/Earn/EarnSuggester/RewardPosts">
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        Reward Posts
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
            <p style={{ fontWeight: 'bold', fontSize: '2rem' }}>Earn XP</p>
            <Button
              onClick={() => onSetEarnSection('subject')}
              style={{ marginTop: '1rem' }}
              filled
              color="logoBlue"
            >
              <Icon icon="bolt" />
              <span style={{ marginLeft: '1rem' }}>
                Respond to high XP subjects
              </span>
            </Button>
            <p
              style={{
                fontWeight: 'bold',
                fontSize: '2rem',
                marginTop: '1.5rem'
              }}
            >
              Earn Karma Points
            </p>
            <Button
              onClick={() => onSetEarnSection('recommend')}
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
}
