import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useHomeContext } from '~/contexts';
import { css } from '@emotion/css';

export default function KarmaMenu() {
  const onSetTopMenuSectionSection = useHomeContext(
    (v) => v.actions.onSetTopMenuSectionSection
  );

  return (
    <ErrorBoundary componentPath="Home/Earn/ActivitySuggester/KarmaMenu">
      <div
        className={css`
          > section {
            display: flex;
            flex-direction: column;
            width: 100%;
          }
        `}
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <section>
          <p>Earn Karma Points</p>
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
        </section>
      </div>
    </ErrorBoundary>
  );
}
