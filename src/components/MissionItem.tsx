import React, { useMemo } from 'react';
import RewardText from '~/components/Texts/RewardText';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { useNavigate } from 'react-router-dom';
import { useAppContext, useMissionContext, useKeyContext } from '~/contexts';
import { checkMultiMissionPassStatus } from '~/helpers/userDataHelpers';
import { returnMissionThumb } from '~/constants/defaultValues';

export default function MissionItem({
  isRepeatable,
  style,
  locked,
  mission,
  missionLink,
  showStatus = true
}: {
  isRepeatable?: boolean;
  style?: React.CSSProperties;
  locked?: boolean;
  mission: any;
  missionLink: string;
  showStatus?: boolean;
}) {
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const onOpenSigninModal = useAppContext(
    (v) => v.user.actions.onOpenSigninModal
  );
  const myAttempts = useMissionContext((v) => v.state.myAttempts);
  const statusShown = useMemo(() => {
    if (!showStatus) return false;
    if (mission.isMultiMission) {
      const { numPassedTasks } = checkMultiMissionPassStatus({
        mission,
        myAttempts
      });
      return numPassedTasks > 0;
    }
    return (
      myAttempts[mission.id]?.status &&
      myAttempts[mission.id]?.status !== 'pending'
    );
  }, [mission, myAttempts, showStatus]);
  const passStatus = useMemo(() => {
    if (mission.isMultiMission) {
      const { numTasks, numPassedTasks, passed } = checkMultiMissionPassStatus({
        mission,
        myAttempts
      });
      if (passed) {
        return 'passed';
      }
      return `${numPassedTasks}/${numTasks} passed`;
    }
    return `${myAttempts[mission.id]?.status}ed`;
  }, [mission, myAttempts]);
  const missionThumb = useMemo(
    () => returnMissionThumb(mission.missionType),
    [mission.missionType]
  );

  return (
    <div
      onClick={handleLinkClick}
      style={style}
      className={`${css`
        color: ${Color.black()};
        background: #fff;
        padding: 1rem;
        border: 1px solid var(--ui-border);
        border-radius: ${borderRadius};
        transition: background 0.18s ease, border-color 0.18s ease;
        cursor: ${locked ? 'default' : 'pointer'};
        opacity: ${locked ? 0.2 : 1};
        ${locked
          ? ''
          : `@media (hover: hover) and (pointer: fine) {
               &:hover { border-color: var(--ui-border-strong); }
             }`}
      `}${locked ? ' unselectable' : ''}`}
    >
      <p
        className={css`
          font-size: 2rem;
          font-weight: bold;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.7rem;
          }
        `}
      >
        {mission.title}
      </p>
      <div style={{ marginTop: '1rem', display: 'flex' }}>
        <img
          src={missionThumb}
          style={{ width: '10rem', height: '6rem' }}
          loading="lazy"
        />
        <div
          style={{
            marginLeft: '1rem',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div
            style={{ width: '100%' }}
            className={css`
              font-size: 1.7rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.3rem;
              }
            `}
          >
            {mission.subtitle}
          </div>
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginTop: '1.5rem'
            }}
          >
            <RewardText
              labelClassName={css`
                color: ${Color.darkerGray()};
                font-size: 1.4rem;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.3rem;
                }
              `}
              rewardClassName={css`
                font-size: 1.3rem;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.2rem;
                }
              `}
              isRepeating={isRepeatable}
              coinReward={
                isRepeatable ? mission.repeatCoinReward : mission.coinReward
              }
              xpReward={
                isRepeatable ? mission.repeatXpReward : mission.xpReward
              }
            />
            {statusShown && (
              <div
                className={css`
                  font-size: 1.3rem;
                  @media (max-width: ${mobileMaxWidth}) {
                    font-size: 1.1rem;
                  }
                `}
                style={{
                  fontWeight: 'bold',
                  color:
                    myAttempts[mission.id]?.status === 'pass' ||
                    mission.isMultiMission
                      ? Color.green()
                      : Color.rose()
                }}
              >
                {passStatus}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  function handleLinkClick() {
    if (locked) return;
    if (userId) {
      navigate(missionLink);
    } else {
      onOpenSigninModal();
    }
  }
}
