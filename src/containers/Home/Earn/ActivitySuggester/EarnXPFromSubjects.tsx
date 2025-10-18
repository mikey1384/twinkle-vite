import React, { useEffect, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import ContentListItem from '~/components/ContentListItem';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import localize from '~/constants/localize';
import { useAppContext, useHomeContext } from '~/contexts';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { useRoleColor } from '~/theme/useRoleColor';

const BodyRef = document.scrollingElement || document.documentElement;
const showMeAnotherSubjectLabel = localize('showMeAnotherSubject');

export default function EarnXPFromSubjects() {
  const showMeAnotherSubjectRole = useRoleColor(
    'showMeAnotherSubjectButton',
    { fallback: 'green' }
  );
  const showMeAnotherSubjectButtonColor =
    showMeAnotherSubjectRole.colorKey;
  const onSetTopMenuSectionSection = useHomeContext(
    (v) => v.actions.onSetTopMenuSectionSection
  );
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
    <ErrorBoundary componentPath="Home/Earn/ActivitySuggester/EarnXPFromSubjects">
      <div className={sectionContainer}>
        <h3 className={sectionHeading}>Earn XP by Responding to Subjects</h3>
        <div className={listContainer}>
          {loading ? (
            <Loading />
          ) : (
            subjects.map((subject: { id: number; contentType: string }) => (
              <ContentListItem key={subject.id} contentObj={subject} />
            ))
          )}
          <div className={primaryActionRow}>
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
          <div className={secondaryActionRow}>
            <Button
              onClick={() => handleSetTopMenuSection('recommend')}
              color="brownOrange"
              variant="soft"
              tone="raised"
              stretch
            >
              <Icon icon="heart" />
              <span>Recommend Posts</span>
            </Button>
            <Button
              onClick={() => handleSetTopMenuSection('reward')}
              color="pink"
              variant="soft"
              tone="raised"
              stretch
            >
              <Icon icon="certificate" />
              <span>Reward Posts</span>
            </Button>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );

  function handleSetTopMenuSection(section: string) {
    onSetTopMenuSectionSection(section);
    const appElement = document.getElementById('App');
    if (appElement) {
      appElement.scrollTop = 0;
    }
    BodyRef.scrollTop = 0;
  }

  async function handleLoadAnotherSubjectClick() {
    const appElement = document.getElementById('App');
    if (appElement) {
      appElement.scrollTop = 0;
    }
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

const sectionContainer = css`
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  width: 100%;
`;

const sectionHeading = css`
  margin: 0;
  font-size: 2.1rem;
  font-weight: 700;
  color: var(--home-panel-heading, ${Color.darkerGray()});
`;

const listContainer = css`
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
`;

const primaryActionRow = css`
  display: flex;
  justify-content: center;
  margin-top: 1.6rem;
`;

const secondaryActionRow = css`
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  margin-top: 1.4rem;
`;
