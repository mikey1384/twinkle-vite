import { useEffect, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import ContentListItem from '~/components/ContentListItem';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import localize from '~/constants/localize';
import { useKeyContext, useAppContext, useHomeContext } from '~/contexts';

const showMeAnotherSubjectLabel = localize('showMeAnotherSubject');

export default function EarnXPFromSubjects() {
  const {
    showMeAnotherSubjectButton: { color: showMeAnotherSubjectButtonColor }
  } = useKeyContext((v) => v.theme);
  const onSetEarnSection = useHomeContext((v) => v.actions.onSetEarnSection);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const loadHighXPSubjects = useAppContext(
    (v) => v.requestHelpers.loadHighXPSubjects
  );

  useEffect(() => {
    handleLoadHighXPSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary componentPath="Home/Earn/EarnSuggester/EarnXPFromSubjects">
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <p>Earn XP by Responding to Subjects</p>
        <div style={{ marginTop: '1.5rem' }}>
          {loading ? (
            <Loading />
          ) : (
            <>
              {subjects.map((subject) => (
                <ContentListItem key={subject.id} contentObj={subject} />
              ))}
            </>
          )}
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
              color={showMeAnotherSubjectButtonColor}
              onClick={handleLoadHighXPSubjects}
            >
              <Icon icon="redo" />
              <span style={{ marginLeft: '0.7rem' }}>
                {showMeAnotherSubjectLabel}
              </span>
            </Button>
          </div>
        </div>
        <div
          style={{
            marginTop: '3.5rem',
            width: '100%',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <div
            style={{ display: 'flex', flexDirection: 'column', width: '80%' }}
          >
            <p>Earn Karma Points</p>
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
        </div>
      </div>
    </ErrorBoundary>
  );

  async function handleLoadHighXPSubjects() {
    setLoading(true);
    const data = await loadHighXPSubjects();
    setSubjects(data);
    setLoading(false);
  }
}
