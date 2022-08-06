import { useEffect, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import ContentListItem from '~/components/ContentListItem';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import localize from '~/constants/localize';
import { useKeyContext, useAppContext } from '~/contexts';

const showMeAnotherSubjectLabel = localize('showMeAnotherSubject');

export default function EarnXPFromSubjects() {
  const {
    showMeAnotherSubjectButton: { color: showMeAnotherSubjectButtonColor }
  } = useKeyContext((v) => v.theme);
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
      <p>Earn XP by responding to subjects</p>
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
            marginTop: '2rem',
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
    </ErrorBoundary>
  );

  async function handleLoadHighXPSubjects() {
    setLoading(true);
    const data = await loadHighXPSubjects();
    setSubjects(data);
    setLoading(false);
  }
}
