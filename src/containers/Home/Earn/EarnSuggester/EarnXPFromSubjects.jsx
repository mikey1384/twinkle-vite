import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import ContentListItem from '~/components/ContentListItem';
import Button from '~/components/Button';
import GradientButton from '~/components/Buttons/GradientButton';
import Loading from '~/components/Loading';
import localize from '~/constants/localize';
import { useKeyContext, useAppContext, useHomeContext } from '~/contexts';

const BodyRef = document.scrollingElement || document.documentElement;
const showMeAnotherSubjectLabel = localize('showMeAnotherSubject');

EarnXPFromSubjects.propTypes = {
  onSetGrammarGameModalShown: PropTypes.func.isRequired
};
export default function EarnXPFromSubjects({ onSetGrammarGameModalShown }) {
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
              onClick={handleLoadAnotherSubjectClick}
              disabled={loading}
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
            <p>Earn XP</p>
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
            <Button
              onClick={() => handleSetEarnSection('reward')}
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

  function handleSetEarnSection(section) {
    onSetEarnSection(section);
    document.getElementById('App').scrollTop = 0;
    BodyRef.scrollTop = 0;
  }

  async function handleLoadAnotherSubjectClick() {
    document.getElementById('App').scrollTop = 0;
    BodyRef.scrollTop = 0;
    handleLoadHighXPSubjects();
  }

  async function handleLoadHighXPSubjects() {
    setLoading(true);
    const data = await loadHighXPSubjects();
    setSubjects(data);
    setLoading(false);
  }
}
