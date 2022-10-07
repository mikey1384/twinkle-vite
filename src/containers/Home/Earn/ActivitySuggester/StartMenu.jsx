import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useHomeContext } from '~/contexts';

export default function StartMenu() {
  const onSetTopMenuSectionSection = useHomeContext(
    (v) => v.actions.onSetTopMenuSectionSection
  );

  return (
    <ErrorBoundary componentPath="Home/Earn/ActivitySuggester/StartMenu">
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Button
          onClick={() => onSetTopMenuSectionSection('recommend')}
          style={{ marginTop: '0.7rem' }}
          filled
          color="brownOrange"
        >
          <Icon icon="heart" />
          <span style={{ marginLeft: '0.7rem' }}>Recommend posts</span>
        </Button>
        <Button
          onClick={() => onSetTopMenuSectionSection('reward')}
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
