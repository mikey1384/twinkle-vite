import React, { Children, useEffect, useMemo, useRef } from 'react';
import Button from '~/components/Button';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import { useAppContext, useKeyContext } from '~/contexts';
import { scrollElementToCenter } from '~/helpers';

MultiStepContainer.propTypes = {
  children: PropTypes.node,
  buttons: PropTypes.array,
  onOpenTutorial: PropTypes.func,
  taskId: PropTypes.number.isRequired,
  taskType: PropTypes.string.isRequired
};

export default function MultiStepContainer({
  children,
  buttons = [],
  onOpenTutorial,
  taskId,
  taskType
}: {
  children: React.ReactNode;
  buttons?: object[];
  onOpenTutorial: () => void;
  taskId: number;
  taskType: string;
}) {
  const missions = useKeyContext((v) => v.myState.missions);
  const warningColor = useKeyContext((v) => v.theme.warning.color);
  const updateMissionStatus = useAppContext(
    (v) => v.requestHelpers.updateMissionStatus
  );
  const onUpdateUserMissionState = useAppContext(
    (v) => v.user.actions.onUpdateUserMissionState
  );
  const selectedIndex = useMemo(
    () => missions[taskType]?.selectedIndex || 0,
    [missions, taskType]
  );
  const SlideRefs: React.RefObject<any> = useRef({});
  const childrenArray = useMemo(() => Children.toArray(children), [children]);
  const DisplayedSlide = useMemo(() => {
    const SlideComponent: any = childrenArray.filter(
      (_, index) => index === selectedIndex
    )[0];
    return React.cloneElement(SlideComponent, {
      innerRef: (ref: React.RefObject<any>) =>
        (SlideRefs.current[selectedIndex] = ref),
      index: selectedIndex
    });
  }, [childrenArray, selectedIndex]);

  const NextButton = useMemo(() => {
    const DefaultButton = (
      <Button skeuomorphic filled color="green" onClick={handleGoNext}>
        <span>Next</span>
        <Icon style={{ marginLeft: '0.7rem' }} icon="arrow-right" />
      </Button>
    );
    const CustomButton = buttons
      .filter(
        (buttonObj, index) =>
          index === selectedIndex && index < childrenArray.length - 1
      )
      .map((buttonObj: any, index) =>
        buttonObj ? (
          <Button
            key={index}
            color={buttonObj.color || 'logoBlue'}
            skeuomorphic={buttonObj.skeuomorphic}
            filled={buttonObj.filled}
            disabled={buttonObj.disabled}
            onClick={
              buttonObj.onClick
                ? () => buttonObj.onClick(handleGoNext)
                : handleGoNext
            }
          >
            <span>{buttonObj.disabled ? 'Next' : buttonObj.label}</span>
            {!buttonObj.noArrow && (
              <Icon style={{ marginLeft: '0.7rem' }} icon="arrow-right" />
            )}
          </Button>
        ) : (
          DefaultButton
        )
      )?.[0];
    if (CustomButton) {
      return CustomButton;
    }
    if (selectedIndex < childrenArray.length - 1) {
      return DefaultButton;
    }

    async function handleGoNext() {
      await handleUpdateSelectedIndex(selectedIndex + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buttons, selectedIndex, childrenArray.length, taskId]);

  useEffect(() => {
    scrollElementToCenter(SlideRefs.current[selectedIndex]);
  }, [selectedIndex]);

  return (
    <ErrorBoundary
      componentPath="MissionModule/components/MultiStepContainer"
      style={{ width: '100%' }}
    >
      <div style={{ width: '100%', minHeight: '7rem' }}>{DisplayedSlide}</div>
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: '2rem'
        }}
      >
        {NextButton}
        {selectedIndex > 0 && (
          <Button
            skeuomorphic
            style={{ marginTop: NextButton ? '7rem' : '3rem' }}
            color="black"
            onClick={() =>
              handleUpdateSelectedIndex(Math.max(selectedIndex - 1, 0))
            }
          >
            <Icon icon="arrow-left" />
            <span style={{ marginLeft: '0.7rem' }}>Back</span>
          </Button>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            fontSize: '1.7rem',
            marginTop: '5rem'
          }}
        >
          <Button skeuomorphic color={warningColor} onClick={onOpenTutorial}>
            {`I don't understand what I am supposed to do`}
          </Button>
        </div>
      </div>
    </ErrorBoundary>
  );

  async function handleUpdateSelectedIndex(newIndex: number) {
    await updateMissionStatus({
      missionType: taskType,
      newStatus: { selectedIndex: newIndex }
    });
    onUpdateUserMissionState({
      missionType: taskType,
      newState: { selectedIndex: newIndex }
    });
  }
}
