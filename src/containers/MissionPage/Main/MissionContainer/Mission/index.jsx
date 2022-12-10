import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import LongText from '~/components/Texts/LongText';
import MissionModule from '../../MissionModule';
import MultiMission from './MultiMission';
import RewardText from '~/components/Texts/RewardText';
import ErrorBoundary from '~/components/ErrorBoundary';
import ApprovedStatus from '../../ApprovedStatus';
import PendingStatus from '../../PendingStatus';
import Loading from '~/components/Loading';
import { panel } from '../../../Styles';
import { returnMissionThumb } from '~/constants/defaultValues';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import {
  useViewContext,
  useAppContext,
  useMissionContext,
  useKeyContext
} from '~/contexts';

Mission.propTypes = {
  style: PropTypes.object,
  onSetMissionState: PropTypes.func,
  mission: PropTypes.object
};

export default function Mission({
  mission,
  mission: {
    fileUploadProgress,
    title,
    subtitle,
    description,
    objective,
    id: missionId,
    xpReward,
    coinReward,
    repeatXpReward,
    repeatCoinReward,
    uploadingFile
  },
  style,
  onSetMissionState
}) {
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageVisible]);

  useEffect(() => {
    if (title) {
      onSetPageTitle(`Mission: ${title}`);
    }
    return () => onSetPageTitle('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  const { isCreator } = useKeyContext((v) => v.myState);
  return (
    <ErrorBoundary
      componentPath="MissionPage/Main/MissionContainer/Mission/index"
      className={`${panel} ${
        isCreator
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%'
        }}
      >
        <div style={{ width: '80%' }}>
          <h1
            className={css`
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 2.3rem;
              }
            `}
          >
            {title}
          </h1>
          <p
            className={css`
              font-size: 1.7rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.5rem;
              }
            `}
          >
            {subtitle}
          </p>
        </div>
        <div style={{ width: '20%' }}>
          <img
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            src={missionThumb}
          />
        </div>
      </div>
      <LongText style={{ fontSize: '1.5rem' }}>{description}</LongText>
      {myAttempt?.status !== 'pending' && (
        <div
          style={{
            marginTop: '3rem'
          }}
        >
          <div>
            <p
              className={css`
                font-weight: bold;
                font-size: 2rem;
              `}
            >
              Objective:
            </p>
            <LongText
              className={css`
                font-size: 1.7rem;
                margin-top: 0.5rem;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.5rem;
                }
              `}
            >
              {objective}
            </LongText>
          </div>
          <RewardText
            checked={isRepeating}
            style={{ marginTop: '2rem' }}
            xpReward={xpReward}
            coinReward={coinReward}
          />
          {isRepeating && (
            <RewardText
              isRepeating
              style={{ marginTop: '1rem' }}
              xpReward={repeatXpReward}
              coinReward={repeatCoinReward}
            />
          )}
        </div>
      )}
      {loading ? (
        <Loading />
      ) : myAttempt?.status === 'pending' ? (
        <PendingStatus style={{ marginTop: '7rem' }} />
      ) : (!mission.repeatable && myAttempt?.status === 'pass') ||
        (myAttempt?.status === 'fail' && !myAttempt?.tryingAgain) ? (
        <ApprovedStatus
          missionId={mission.id}
          xpReward={mission.xpReward}
          coinReward={mission.coinReward}
          myAttempt={myAttempt}
          style={{ marginTop: '3rem' }}
        />
      ) : mission.isMultiMission ? (
        <MultiMission myAttempts={myAttempts} mission={mission} />
      ) : (
        <MissionModule
          mission={mission}
          isRepeating={isRepeating}
          fileUploadProgress={fileUploadProgress}
          onSetMissionState={onSetMissionState}
          uploadingFile={uploadingFile}
          style={{ marginTop: '4.5rem' }}
        />
      )}
    </ErrorBoundary>
  );
}
