import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import { Color } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';
import queryString from 'query-string';
import GitHubButton from './GitHubButton';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import StepSlide from '../components/StepSlide';
import MultiStepContainer from '../components/MultiStepContainer';

GitHubVerifier.propTypes = {
  onSetMissionState: PropTypes.func.isRequired,
  task: PropTypes.object.isRequired
};

export default function GitHubVerifier({
  onSetMissionState,
  task
}: {
  onSetMissionState: (arg0: { missionId: any; newState: any }) => void;
  task: any;
}) {
  const loadGitHubData = useAppContext((v) => v.requestHelpers.loadGitHubData);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const { userId } = useKeyContext((v) => v.myState);
  const location = useLocation();
  const { search } = location;
  const { code } = useMemo(() => queryString.parse(search), [search]);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (code) {
      initGitHubData();
    }
    async function initGitHubData() {
      try {
        setLoading(true);
        const githubUsername = await loadGitHubData(code);
        onSetUserState({
          userId,
          newState: { githubUsername }
        });
      } catch (_error) {
        setErrorMsg('Failed to fetch your GitHub username - try again');
      }
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <ErrorBoundary componentPath="MissionModule/GitHub/GitHubVerifier">
      <div>
        {loading && <Loading />}
        {!loading && (
          <MultiStepContainer
            taskId={task.id}
            taskType={task.missionType}
            buttons={[
              {
                label: 'I created a github account',
                color: 'logoBlue',
                skeuomorphic: true
              }
            ]}
            onOpenTutorial={() =>
              onSetMissionState({
                missionId: task.id,
                newState: { tutorialStarted: true }
              })
            }
          >
            <StepSlide
              title={
                <>
                  Create a GitHub account from{' '}
                  <a
                    href="https://www.github.com"
                    target="_blank"
                    rel="noreferrer"
                  >
                    https://github.com
                  </a>
                </>
              }
            />
            <StepSlide title="Tap the GitHub button below">
              <GitHubButton style={{ marginTop: '1.5rem' }} />
              <div
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  marginTop: '1rem',
                  color: Color.red()
                }}
              >
                {errorMsg}
              </div>
            </StepSlide>
          </MultiStepContainer>
        )}
      </div>
    </ErrorBoundary>
  );
}
