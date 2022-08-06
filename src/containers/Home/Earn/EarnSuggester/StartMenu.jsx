import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useHomeContext } from '~/contexts';

export default function StartMenu() {
  const onSetEarnSection = useHomeContext((v) => v.actions.onSetEarnSection);

  return (
    <ErrorBoundary componentPath="Home/Earn/EarnSuggester/StartMenu">
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <p style={{ fontWeight: 'bold', fontSize: '2rem' }}>Earn XP</p>
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
      </div>
      <div
        style={{
          marginTop: '2rem',
          width: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <p style={{ fontWeight: 'bold', fontSize: '2rem' }}>
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
    </ErrorBoundary>
  );
}
