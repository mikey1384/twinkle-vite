import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import ItemPanel from './ItemPanel';
import Icon from '~/components/Icon';
import MaxLevelItemInfo from './MaxLevelItemInfo';
import { css } from '@emotion/css';
import { Color, Theme, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';
import {
  karmaPointTable,
  videoRewardHash,
  SELECTED_LANGUAGE
} from '~/constants/defaultValues';
import localize from '~/constants/localize';

const boostRewardsFromWatchingXPVideosLabel = localize(
  'boostRewardsFromWatchingXPVideos'
);

const item = {
  maxLvl: 10,
  name: [
    boostRewardsFromWatchingXPVideosLabel,
    `${boostRewardsFromWatchingXPVideosLabel} (level 2)`,
    `${boostRewardsFromWatchingXPVideosLabel} (level 3)`,
    `${boostRewardsFromWatchingXPVideosLabel} (level 4)`,
    `${boostRewardsFromWatchingXPVideosLabel} (level 5)`,
    `${boostRewardsFromWatchingXPVideosLabel} (level 6)`,
    `${boostRewardsFromWatchingXPVideosLabel} (level 7)`,
    `${boostRewardsFromWatchingXPVideosLabel} (level 8)`,
    `${boostRewardsFromWatchingXPVideosLabel} (level 9)`,
    `${boostRewardsFromWatchingXPVideosLabel} (level 10)`
  ],
  description: [...Array(10).keys()].map((key) => {
    const rewardLevels = [1, 2, 3, 4, 5];
    const keyNumber = Number(key);
    const descriptionLabel =
      SELECTED_LANGUAGE === 'kr' ? (
        <>
          본 아이템을 {keyNumber === 0 ? '잠금 해제' : '업그레이드'} 하시면 XP
          동영상을 보실때 <b>매분마다</b> 아래의 보상을 획득하실 수 있게 됩니다
        </>
      ) : (
        <>
          {keyNumber === 0 ? 'Unlock' : 'Upgrade'} this item to earn the
          following rewards <b>per minute</b> while watching XP Videos
        </>
      );

    return (
      <div style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }} key={key}>
        <p>{descriptionLabel}</p>
        <div
          style={{
            width: '100%',
            marginTop: '3rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative'
          }}
        >
          {rewardLevels.map((rewardLevel, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                width: '80%',
                justifyContent: 'space-between',
                marginTop: index === 0 ? 0 : '1rem'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: `8rem`,
                  justifyContent: 'center'
                }}
              >
                <div
                  className={css`
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-width: 4rem;
                    padding: 0.5rem 0.5rem;
                    background: ${Color[
                      Theme()[`level${rewardLevel}`].color
                    ]()};
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #fff;
                    @media (max-width: ${mobileMaxWidth}) {
                      font-size: 1rem;
                    }
                  `}
                >
                  <div style={{ fontSize: '1rem', lineHeight: 1 }}>
                    {[...Array(rewardLevel)].map((elem, index) => (
                      <Icon
                        key={index}
                        style={{ verticalAlign: 0 }}
                        icon="star"
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  marginLeft: '3rem',
                  flexGrow: 1
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    width: '95%',
                    justifyContent: 'space-around'
                  }}
                >
                  <div>
                    {videoRewardHash[keyNumber].xp * rewardLevel} XP
                    {rewardLevel > 2 ? (
                      <span>
                        {`, `}
                        <span style={{ marginLeft: '0.5rem' }}>
                          <Icon icon={['far', 'badge-dollar']} />{' '}
                          {videoRewardHash[keyNumber].coin}
                        </span>
                      </span>
                    ) : (
                      ''
                    )}
                  </div>
                  <div style={{ color: Color.green() }}>
                    <Icon icon="arrow-right" />
                  </div>
                  <div
                    style={{
                      fontWeight: 'bold',
                      color: Color.brownOrange()
                    }}
                  >
                    {videoRewardHash[keyNumber + 1].xp * rewardLevel} XP
                    {rewardLevel > 2 ? (
                      <span>
                        {`, `}
                        <span style={{ marginLeft: '0.5rem' }}>
                          <Icon icon={['far', 'badge-dollar']} />{' '}
                          {videoRewardHash[keyNumber + 1].coin}
                        </span>
                      </span>
                    ) : (
                      ''
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  })
};

RewardBoostItem.propTypes = {
  style: PropTypes.object
};

export default function RewardBoostItem({ style }) {
  const [unlocking, setUnlocking] = useState(false);
  const { rewardBoostLvl, karmaPoints, userId } = useKeyContext(
    (v) => v.myState
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const upgradeRewardBoost = useAppContext(
    (v) => v.requestHelpers.upgradeRewardBoost
  );
  const maxLevelItemDescriptionLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return `이제 XP동영상을 시청하실 때 매분 (보상레벨 × ${videoRewardHash[rewardBoostLvl].xp})XP와 트윈클 코인 ${videoRewardHash[rewardBoostLvl].coin}개를 획득하실 수 있습니다`;
    }
    return `You can now earn (reward level × ${videoRewardHash[rewardBoostLvl].xp}) XP and ${videoRewardHash[rewardBoostLvl].coin} Twinkle Coins per minute while watching XP Videos`;
  }, [rewardBoostLvl]);

  return (
    <ItemPanel
      isLeveled
      currentLvl={rewardBoostLvl}
      maxLvl={item.maxLvl}
      karmaPoints={karmaPoints}
      requiredKarmaPoints={karmaPointTable.rewardBoost[rewardBoostLvl]}
      locked={!rewardBoostLvl}
      unlocking={unlocking}
      onUnlock={handleUpgrade}
      itemName={item.name[rewardBoostLvl]}
      itemDescription={item.description[rewardBoostLvl]}
      style={style}
      upgradeIcon={<Icon size="3x" icon="bolt" />}
    >
      <MaxLevelItemInfo
        icon="bolt"
        title={
          SELECTED_LANGUAGE === 'kr'
            ? 'XP동영상 보상 증가 - Level 10'
            : 'XP Video Reward Boost - Level 10'
        }
        description={maxLevelItemDescriptionLabel}
      />
    </ItemPanel>
  );

  async function handleUpgrade() {
    setUnlocking(true);
    try {
      const success = await upgradeRewardBoost();
      if (success) {
        onSetUserState({
          userId,
          newState: {
            rewardBoostLvl: Math.min(
              Number(rewardBoostLvl) + 1,
              Number(item.maxLvl)
            )
          }
        });
      }
      return Promise.resolve();
    } catch (error) {
      console.error(error);
    } finally {
      setUnlocking(false);
    }
  }
}
