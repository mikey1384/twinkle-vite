import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ErrorBoundary from '~/components/ErrorBoundary';
import Project from './Project';
import MainMenu from './MainMenu';
import { useBuildContext } from '~/contexts';
import { useTransition, animated } from 'react-spring';
import { socket } from '~/constants/sockets/compiler';

export default function Build() {
  const location = useLocation();
  const [prevPath, setPrevPath] = useState(location.pathname);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  const onSetProjectType = useBuildContext(
    (value: any) => value.actions.onSetProjectType
  );
  const onResetProjectData = useBuildContext(
    (v) => v.actions.onResetProjectData
  );
  const onSetIsProjectScreenShown = useBuildContext(
    (value: any) => value.actions.onSetIsProjectScreenShown
  );
  const isProjectScreenShown = useBuildContext(
    (value: any) => value.state.isProjectScreenShown
  );
  const projectId = useBuildContext((v) => v.state.projectId);
  const projectType = useBuildContext((v) => v.state.projectType);

  useEffect(() => {
    if (
      location.pathname.startsWith('/build') &&
      prevPath.startsWith('/build')
    ) {
      setShouldAnimate(true);
    } else {
      setShouldAnimate(false);
    }
    setPrevPath(location.pathname);
  }, [location.pathname, prevPath]);

  useEffect(() => {
    if (!projectId) return;
    socket.on('connect', () => {
      console.log(`Connected to compiler server with socket ID: ${socket.id}`);
      socket.emit('join_project', { projectId });
      if (projectType) {
        socket.emit('initialize_dev_session', { projectId, projectType });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [projectId, projectType]);

  const mainMenuTransitions = useTransition(!isProjectScreenShown, {
    from: { opacity: 0, transform: 'translateX(-100%)' },
    enter: { opacity: 1, transform: 'translateX(0%)' },
    leave: { opacity: 0, transform: 'translateX(-100%)' },
    config: { duration: 300 },
    immediate: !shouldAnimate
  });

  const projectTransitions = useTransition(isProjectScreenShown, {
    from: { opacity: 0, transform: 'translateX(100%)' },
    enter: { opacity: 1, transform: 'translateX(0%)' },
    leave: { opacity: 0, transform: 'translateX(100%)' },
    config: { duration: 300 },
    immediate: !shouldAnimate
  });

  return (
    <ErrorBoundary componentPath="Build/index">
      {mainMenuTransitions(
        (styles, item) =>
          item && (
            <animated.div
              style={{
                ...styles,
                width: '100%',
                height: '100%',
                position: 'absolute'
              }}
            >
              <MainMenu
                onOptionSelect={handleOptionSelect}
                onCreateNewProject={handleCreateNewProject}
              />
            </animated.div>
          )
      )}
      {projectTransitions(
        (styles, item) =>
          item && (
            <animated.div
              style={{
                ...styles,
                width: '100%',
                height: '100%',
                position: 'absolute'
              }}
            >
              <Project
                onSetIsBuildScreenShown={(shown) =>
                  onSetIsProjectScreenShown({ isProjectScreenShown: shown })
                }
              />
            </animated.div>
          )
      )}
    </ErrorBoundary>
  );

  function handleCreateNewProject(projectType: string) {
    onResetProjectData();
    onSetProjectType({ projectType });
    onSetIsProjectScreenShown({ isProjectScreenShown: true });
  }

  function handleOptionSelect(option: string) {
    if (option === 'resume') {
      onSetIsProjectScreenShown({ isProjectScreenShown: true });
    }
  }
}
