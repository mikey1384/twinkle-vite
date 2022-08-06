import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import Icon from '~/components/Icon';

export default function StartMenu() {
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
        <Button style={{ marginTop: '1rem' }} filled color="logoBlue">
          <Icon icon="bolt" />
          <span style={{ marginLeft: '1rem' }}>
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
        <Button style={{ marginTop: '0.7rem' }} filled color="brownOrange">
          <Icon icon="heart" />
          <span style={{ marginLeft: '0.7rem' }}>Recommend posts</span>
        </Button>
        <Button style={{ marginTop: '0.7rem' }} filled color="pink">
          <Icon icon="certificate" />
          <span style={{ marginLeft: '0.7rem' }}>Reward posts</span>
        </Button>
      </div>
    </ErrorBoundary>
  );
}
