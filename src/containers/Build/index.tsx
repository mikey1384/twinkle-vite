import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Project from './Project';
import MainMenu from './MainMenu';
import { useBuildContext } from '~/contexts';
import { useTransition, animated } from 'react-spring';

export default function Build() {
  const onSetIsProjectScreenShown = useBuildContext(
    (value: any) => value.actions.onSetIsProjectScreenShown
  );
  const isProjectScreenShown = useBuildContext(
    (value: any) => value.state.isProjectScreenShown
  );

  const mainMenuTransitions = useTransition(!isProjectScreenShown, {
    from: { opacity: 0, transform: 'translateX(-100%)' },
    enter: { opacity: 1, transform: 'translateX(0%)' },
    leave: { opacity: 0, transform: 'translateX(-100%)' },
    config: { duration: 300 }
  });

  const projectTransitions = useTransition(isProjectScreenShown, {
    from: { opacity: 0, transform: 'translateX(100%)' },
    enter: { opacity: 1, transform: 'translateX(0%)' },
    leave: { opacity: 0, transform: 'translateX(100%)' },
    config: { duration: 300 }
  });

  return (
    <ErrorBoundary componentPath="App">
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
                onOptionSelect={(option: string) => console.log(option)}
                onSetIsBuildScreenShown={(shown) =>
                  onSetIsProjectScreenShown({ isProjectScreenShown: shown })
                }
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
}
