import React, { useRef, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import CodeSandbox from '~/components/Forms/CodeSandbox';
import defaultCode from './defaultCode';
import ErrorBoundary from '~/components/ErrorBoundary';
import StepSlide from '../components/StepSlide';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useAppContext, useKeyContext } from '~/contexts';

FinalizeYourCode.propTypes = {
  index: PropTypes.number,
  code: PropTypes.string,
  task: PropTypes.object.isRequired,
  username: PropTypes.string,
  onSetCode: PropTypes.func.isRequired
};

export default function FinalizeYourCode({
  code,
  index,
  task,
  username,
  onSetCode
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const updateMissionStatus = useAppContext(
    (v) => v.requestHelpers.updateMissionStatus
  );
  const [errorMsg, setErrorMsg] = useState('');
  const ComponentRef = useRef(null);
  const initialCode = useMemo(() => defaultCode({ username }), [username]);
  const [saveAvailable, setSaveAvailable] = useState(true);

  return (
    <ErrorBoundary
      componentPath="MissionModule/LaunchTheWebsite/FinalizeYourCode"
      className={css`
        margin-top: 3rem;
        @media (max-width: ${mobileMaxWidth}) {
          margin-top: 2rem;
        }
      `}
    >
      <StepSlide
        index={index}
        title={
          <>
            Below is the website code we worked on earlier.
            <br />
            <span style={{ color: Color.logoBlue() }}>
              Feel free to change it anyway you want
            </span>{' '}
            before we publish it on the internet!
            <br /> Check out the{' '}
            <span style={{ color: Color.brownOrange() }}>tutorial</span> for
            ways to make it look better
          </>
        }
      >
        <div
          ref={ComponentRef}
          className={css`
            margin-top: 2rem;
            margin-bottom: 2.5rem;
            width: 80%;
            @media (max-width: ${mobileMaxWidth}) {
              width: 100%;
            }
          `}
        >
          <CodeSandbox
            style={{ marginTop: '5rem' }}
            code={code}
            initialCode={initialCode}
            onSetCode={(code) => {
              onSetCode(code);
              setSaveAvailable(true);
            }}
            onSetErrorMsg={setErrorMsg}
            hasError={!!errorMsg}
            prevUserId={task.prevUserId}
            runButtonLabel="check"
          />
        </div>
        <Button
          disabled={!saveAvailable}
          onClick={handleSave}
          style={{ marginTop: '2rem', marginBottom: '-0.5rem' }}
          skeuomorphic
          color={doneColor}
        >
          <Icon icon="save" />
          <span style={{ marginLeft: '0.7rem' }}>
            {saveAvailable ? 'Save' : 'Saved'}
          </span>
        </Button>
      </StepSlide>
    </ErrorBoundary>
  );

  async function handleSave() {
    await updateMissionStatus({
      missionType: task.missionType,
      newStatus: { code }
    });
    setSaveAvailable(false);
  }
}
