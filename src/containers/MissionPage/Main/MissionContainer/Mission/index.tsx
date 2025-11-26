import React, { useEffect, useMemo, useRef, useState } from 'react';
import RichText from '~/components/Texts/RichText';
import MissionModule from '../../MissionModule';
import MultiMission from './MultiMission';
import Icon from '~/components/Icon';
import ErrorBoundary from '~/components/ErrorBoundary';
import ApprovedStatus from '../../ApprovedStatus';
import PendingStatus from '../../PendingStatus';
import Loading from '~/components/Loading';
import { panel } from '../../../Styles';
import { returnMissionThumb } from '~/constants/defaultValues';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import {
  useViewContext,
  useAppContext,
  useMissionContext,
  useKeyContext
} from '~/contexts';

export default function Mission({
  mission,
  mission: {
    title,
    subtitle,
    description,
    objective,
    id: missionId,
    xpReward,
    coinReward,
    repeatXpReward,
    repeatCoinReward
  },
  style,
  onSetMissionState
}: {
  style?: React.CSSProperties;
  onSetMissionState: (arg0: any) => any;
  mission: {
    title: string;
    subtitle: string;
    description: string;
    objective: string;
    id: number;
    isMultiMission: boolean;
    missionType: string;
    xpReward: number;
    coinReward: number;
    repeatXpReward: number;
    repeatable: boolean;
    repeatCoinReward: number;
  };
}) {
  const isAdmin = useKeyContext((v) => v.myState.isAdmin);
  const [loading, setLoading] = useState(false);
  const checkMissionStatus = useAppContext(
    (v) => v.requestHelpers.checkMissionStatus
  );
  const myAttempts = useMissionContext((v) => v.state.myAttempts);
  const onUpdateMissionAttempt = useMissionContext(
    (v) => v.actions.onUpdateMissionAttempt
  );
  const onSetPageTitle = useViewContext((v) => v.actions.onSetPageTitle);
  const pageVisible = useViewContext((v) => v.state.pageVisible);
  const hasCheckedStatusRef = useRef(false);
  const skipPageVisibleReload = mission.missionType === 'system-prompt';
  const myAttempt = useMemo(
    () => myAttempts[missionId],
    [missionId, myAttempts]
  );
  const isRepeating = useMemo(
    () => myAttempt?.status === 'pass' && !!mission.repeatable,
    [mission.repeatable, myAttempt?.status]
  );
  const missionThumb = useMemo(
    () => returnMissionThumb(mission.missionType),
    [mission.missionType]
  );

  useEffect(() => {
    if (pageVisible) {
      handleCheckMissionStatus();
    }

    async function handleCheckMissionStatus() {
      if (skipPageVisibleReload && hasCheckedStatusRef.current) return;
      setLoading(true);
      const { filePath, feedback, status, reviewTimeStamp, reviewer } =
        await checkMissionStatus(missionId);
      if (status && !(status === 'fail' && myAttempt?.tryingAgain)) {
        onUpdateMissionAttempt({
          missionId,
          newState: { filePath, feedback, reviewer, reviewTimeStamp, status }
        });
      }
      setLoading(false);
      hasCheckedStatusRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageVisible, skipPageVisibleReload]);

  useEffect(() => {
    hasCheckedStatusRef.current = false;
  }, [missionId]);

  useEffect(() => {
    if (title) {
      onSetPageTitle(`Mission: ${title}`);
    }
    return () => onSetPageTitle('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  return (
    <ErrorBoundary
      componentPath="MissionPage/Main/MissionContainer/Mission/index"
      className={`${panel} ${
        isAdmin
          ? ''
          : css`
              @media (max-width: ${mobileMaxWidth}) {
                border-top: 0;
              }
            `
      }`}
      style={{
        paddingBottom: '2.5rem',
        ...style
      }}
    >
      {/* Mission Header Card */}
      <div
        className={css`
          background: #fff;
          border: 1px solid var(--ui-border);
          border-radius: ${borderRadius};
          overflow: hidden;
          margin-bottom: 1.5rem;
          @media (max-width: ${mobileMaxWidth}) {
            border-radius: 0;
            border-left: 0;
            border-right: 0;
          }
        `}
      >
        {/* Header Section */}
        <div
          className={css`
            padding: 2rem 2.4rem;
            @media (max-width: ${mobileMaxWidth}) {
              padding: 1.4rem 1.6rem;
            }
          `}
        >
          <div
            className={css`
              display: flex;
              gap: 1.6rem;
              align-items: flex-start;
              @media (max-width: ${mobileMaxWidth}) {
                gap: 1.2rem;
              }
            `}
          >
            {/* Thumbnail */}
            <div
              className={css`
                flex-shrink: 0;
                width: 8rem;
                height: 8rem;
                border-radius: ${borderRadius};
                overflow: hidden;
                border: 1px solid var(--ui-border);
                @media (max-width: ${mobileMaxWidth}) {
                  width: 6rem;
                  height: 6rem;
                }
              `}
            >
              <img
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                src={missionThumb}
                alt={title}
              />
            </div>

            {/* Title & Subtitle */}
            <div
              className={css`
                flex: 1;
                min-width: 0;
              `}
            >
              <h1
                className={css`
                  margin: 0 0 0.6rem;
                  font-size: 2.4rem;
                  font-weight: 700;
                  color: ${Color.black()};
                  line-height: 1.2;
                  @media (max-width: ${mobileMaxWidth}) {
                    font-size: 1.9rem;
                  }
                `}
              >
                {title}
              </h1>
              <p
                className={css`
                  margin: 0;
                  font-size: 1.5rem;
                  color: ${Color.darkerGray()};
                  line-height: 1.4;
                  @media (max-width: ${mobileMaxWidth}) {
                    font-size: 1.3rem;
                  }
                `}
              >
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        {description && (
          <div
            className={css`
              padding: 1.6rem 2.4rem;
              background: ${Color.highlightGray(0.3)};
              border-top: 1px solid var(--ui-border);
              @media (max-width: ${mobileMaxWidth}) {
                padding: 1.4rem 1.6rem;
              }
            `}
          >
            <RichText
              className={css`
                font-size: 1.5rem;
                line-height: 1.6;
                color: ${Color.darkerGray()};
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.4rem;
                }
              `}
            >
              {description}
            </RichText>
          </div>
        )}
      </div>

      {/* Objective & Reward Card */}
      {myAttempt?.status !== 'pending' && (
        <div
          className={css`
            background: #fff;
            border: 1px solid var(--ui-border);
            border-radius: ${borderRadius};
            overflow: hidden;
            margin-bottom: 1.5rem;
            @media (max-width: ${mobileMaxWidth}) {
              border-radius: 0;
              border-left: 0;
              border-right: 0;
            }
          `}
        >
          {/* Objective Section */}
          <div
            className={css`
              padding: 2rem 2.4rem;
              @media (max-width: ${mobileMaxWidth}) {
                padding: 1.4rem 1.6rem;
              }
            `}
          >
            <h2
              className={css`
                margin: 0 0 1rem;
                font-weight: 700;
                font-size: 1.9rem;
                color: ${Color.black()};
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.7rem;
                }
              `}
            >
              Objective
            </h2>
            <RichText
              className={css`
                font-size: 1.5rem;
                line-height: 1.6;
                color: ${Color.darkerGray()};
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.4rem;
                }
              `}
            >
              {objective}
            </RichText>
          </div>

          {/* Rewards Section */}
          <div
            className={css`
              padding: 1.8rem 2.4rem;
              background: ${Color.logoBlue(0.03)};
              border-top: 1px solid var(--ui-border);
              @media (max-width: ${mobileMaxWidth}) {
                padding: 1.4rem 1.6rem;
              }
            `}
          >
            <h3
              className={css`
                margin: 0 0 1.2rem;
                font-size: 1.3rem;
                font-weight: 700;
                color: ${Color.darkerGray()};
                letter-spacing: 0.05em;
                text-transform: uppercase;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.2rem;
                  margin-bottom: 1rem;
                }
              `}
            >
              Rewards
            </h3>
            <div
              className={css`
                display: flex;
                flex-wrap: wrap;
                gap: 1rem;
              `}
            >
              {xpReward > 0 && (
                <div
                  className={css`
                    display: flex;
                    align-items: center;
                    gap: 0.7rem;
                    padding: 0.8rem 1.2rem;
                    background: #fff;
                    border: 1px solid var(--ui-border);
                    border-radius: ${borderRadius};
                    ${isRepeating
                      ? `opacity: 0.5; text-decoration: line-through;`
                      : ''}
                  `}
                >
                  <span
                    className={css`
                      font-size: 1.7rem;
                      font-weight: 700;
                      color: ${Color.logoGreen()};
                    `}
                  >
                    {addCommasToNumber(xpReward)}
                  </span>
                  <span
                    className={css`
                      font-size: 1.5rem;
                      font-weight: 700;
                      color: ${Color.gold()};
                    `}
                  >
                    XP
                  </span>
                </div>
              )}
              {coinReward > 0 && (
                <div
                  className={css`
                    display: flex;
                    align-items: center;
                    gap: 0.7rem;
                    padding: 0.8rem 1.2rem;
                    background: #fff;
                    border: 1px solid var(--ui-border);
                    border-radius: ${borderRadius};
                    ${isRepeating
                      ? `opacity: 0.5; text-decoration: line-through;`
                      : ''}
                  `}
                >
                  <Icon
                    icon={['far', 'badge-dollar']}
                    style={{ fontSize: '1.8rem', color: Color.brownOrange() }}
                  />
                  <span
                    className={css`
                      font-size: 1.7rem;
                      font-weight: 700;
                      color: ${Color.darkerGray()};
                    `}
                  >
                    {addCommasToNumber(coinReward)}
                  </span>
                </div>
              )}
            </div>
            {isRepeating && (repeatXpReward > 0 || repeatCoinReward > 0) && (
              <>
                <h3
                  className={css`
                    margin: 1.6rem 0 1.2rem;
                    font-size: 1.3rem;
                    font-weight: 700;
                    color: ${Color.darkerGray()};
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    @media (max-width: ${mobileMaxWidth}) {
                      font-size: 1.2rem;
                      margin: 1.4rem 0 1rem;
                    }
                  `}
                >
                  Repeat Rewards
                </h3>
                <div
                  className={css`
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1rem;
                  `}
                >
                  {repeatXpReward > 0 && (
                    <div
                      className={css`
                        display: flex;
                        align-items: center;
                        gap: 0.7rem;
                        padding: 0.8rem 1.2rem;
                        background: #fff;
                        border: 1px solid var(--ui-border);
                        border-radius: ${borderRadius};
                      `}
                    >
                      <span
                        className={css`
                          font-size: 1.7rem;
                          font-weight: 700;
                          color: ${Color.logoGreen()};
                        `}
                      >
                        {addCommasToNumber(repeatXpReward)}
                      </span>
                      <span
                        className={css`
                          font-size: 1.5rem;
                          font-weight: 700;
                          color: ${Color.gold()};
                        `}
                      >
                        XP
                      </span>
                    </div>
                  )}
                  {repeatCoinReward > 0 && (
                    <div
                      className={css`
                        display: flex;
                        align-items: center;
                        gap: 0.7rem;
                        padding: 0.8rem 1.2rem;
                        background: #fff;
                        border: 1px solid var(--ui-border);
                        border-radius: ${borderRadius};
                      `}
                    >
                      <Icon
                        icon={['far', 'badge-dollar']}
                        style={{
                          fontSize: '1.8rem',
                          color: Color.brownOrange()
                        }}
                      />
                      <span
                        className={css`
                          font-size: 1.7rem;
                          font-weight: 700;
                          color: ${Color.darkerGray()};
                        `}
                      >
                        {addCommasToNumber(repeatCoinReward)}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {loading ? (
        <Loading />
      ) : myAttempt?.status === 'pending' ? (
        <PendingStatus style={{ marginTop: '7rem' }} />
      ) : (!mission.repeatable && myAttempt?.status === 'pass') ||
        (myAttempt?.status === 'fail' && !myAttempt?.tryingAgain) ? (
        mission.missionType === 'system-prompt' ? (
          <MissionModule
            mission={mission}
            isRepeating={isRepeating}
            onSetMissionState={onSetMissionState}
            style={{ marginTop: '1rem' }}
          />
        ) : (
          <ApprovedStatus
            missionId={mission.id}
            xpReward={mission.xpReward}
            coinReward={mission.coinReward}
            myAttempt={myAttempt}
            style={{ marginTop: '3rem' }}
          />
        )
      ) : mission.isMultiMission ? (
        <MultiMission myAttempts={myAttempts} mission={mission} />
      ) : (
        <MissionModule
          mission={mission}
          isRepeating={isRepeating}
          onSetMissionState={onSetMissionState}
          style={{ marginTop: '4.5rem' }}
        />
      )}
    </ErrorBoundary>
  );
}
