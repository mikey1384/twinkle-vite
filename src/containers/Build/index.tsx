import React, { useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Project from './Project';
import MainMenu from './MainMenu';
import { useTransition, animated } from 'react-spring';

export default function Build() {
  const [isBuildScreenShown, setIsBuildScreenShown] = useState(false);

  const mainMenuTransitions = useTransition(!isBuildScreenShown, {
    from: { opacity: 0, transform: 'translateX(-100%)' },
    enter: { opacity: 1, transform: 'translateX(0%)' },
    leave: { opacity: 0, transform: 'translateX(-100%)' },
    config: { duration: 300 }
  });

  const projectTransitions = useTransition(isBuildScreenShown, {
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
                onSetIsBuildScreenShown={setIsBuildScreenShown}
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
              <Project onSetIsBuildScreenShown={setIsBuildScreenShown} />
            </animated.div>
          )
      )}
    </ErrorBoundary>
  );
}
