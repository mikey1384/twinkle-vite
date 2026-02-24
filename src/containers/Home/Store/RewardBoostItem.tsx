import React, { useMemo, useState } from 'react';
import ItemPanel from './ItemPanel';
import Icon from '~/components/Icon';
import MaxLevelItemInfo from './MaxLevelItemInfo';
import { css } from '@emotion/css';
import { Color, Theme } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { videoRewardHash } from '~/constants/defaultValues';

const boostRewardsFromWatchingXPVideosLabel =
  'Boost rewards from watching XP Videos';

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
    const rewardLevels: number[] = [1, 2, 3, 4, 5];
    const keyNumber = Number(key);
    const descriptionLabel = (
      <>
        {keyNumber === 0 ? 'Unlock' : 'Upgrade'} this item to earn the following
        rewards <b>per minute</b> while watching XP Videos
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
          {rewardLevels.map((rewardLevel, index) => {
            const levelToken = Theme()[`level${rewardLevel}`];
            const levelColorKey =
              (levelToken && levelToken.color) || 'logoBlue';
            const levelColorFn = Color[levelColorKey] || Color.logoBlue;
            const levelColor = levelColorFn();
            const levelBorder = levelColorFn();
            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  width: '80%',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: index === 0 ? 0 : '1rem'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    width: '9rem',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <div
                    className={css`
                      height: 2.4rem;
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      padding: 0 0.8rem;
                      border-radius: 9999px;
                      background: ${levelColor};
                      border: 1px solid ${levelBorder};
                      color: #fff;
                    `}
                  >
                    <div style={{ fontSize: '1rem', lineHeight: 1, whiteSpace: 'nowrap' }}>
                      {[...Array(rewardLevel)].map((_, i) => (
                        <Icon key={i} style={{ verticalAlign: 0 }} icon="star" />
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
                      alignItems: 'center'
                    }}
                  >
                  <div
                      style={{ width: '45%', textAlign: 'right' }}
                    >
                    <span style={{ color: Color.logoGreen() }}>
                      {(videoRewardHash[keyNumber]?.xp || 0) * rewardLevel}
                    </span>{' '}
                    <span style={{ color: Color.gold() }}>
                      XP
                    </span>
                    {rewardLevel > 2 ? (
                      <span>
                        {`, `}
                        <span
                          style={{
                            marginLeft: '0.5rem',
                            color: Color.brownOrange()
                          }}
                        >
                          <Icon icon="coins" />{' '}
                          {videoRewardHash[keyNumber]?.coin}
                        </span>
                      </span>
                    ) : null}
                  </div>
                    <div
                      style={{
                        width: '10%',
                        textAlign: 'center',
                        color: Color.green()
                      }}
                    >
                      <Icon icon="arrow-right" />
                    </div>
                    <div
                      style={{
                      width: '45%',
                      fontWeight: 700,
                      textAlign: 'left'
                      }}
                    >
                    <span style={{ color: Color.logoGreen() }}>
                      {videoRewardHash[keyNumber + 1]?.xp * rewardLevel}
                    </span>{' '}
                    <span style={{ color: Color.gold() }}>XP</span>
                    {rewardLevel > 2 ? (
                      <span>
                        {`, `}
                        <span
                          style={{
                            marginLeft: '0.5rem',
                            color: Color.brownOrange(),
                            fontWeight: 700
                          }}
                        >
                          <Icon icon="coins" />{' '}
                          {videoRewardHash[keyNumber + 1]?.coin}
                        </span>
                      </span>
                    ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  })
};

export default function RewardBoostItem({
  loading,
  style
}: {
  loading?: boolean;
  style?: React.CSSProperties;
}) {
  const [unlocking, setUnlocking] = useState(false);
  const { rewardBoostLvl, karmaPoints, userId } = useKeyContext(
    (v) => v.myState
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const upgradeRewardBoost = useAppContext(
    (v) => v.requestHelpers.upgradeRewardBoost
  );
  const maxLevelItemDescriptionLabel = useMemo(() => {
    if (!videoRewardHash[rewardBoostLvl]) {
      return '';
    }
    return `You can now earn (reward level × ${videoRewardHash[rewardBoostLvl].xp}) XP and ${videoRewardHash[rewardBoostLvl].coin} Twinkle Coins per minute while watching XP Videos`;
  }, [rewardBoostLvl]);

  return (
    <ItemPanel
      isLeveled
      currentLvl={rewardBoostLvl}
      maxLvl={item.maxLvl}
      karmaPoints={karmaPoints}
      locked={!rewardBoostLvl}
      unlocking={unlocking}
      onUnlock={handleUpgrade}
      itemKey="rewardBoost"
      itemName={item.name[rewardBoostLvl]}
      itemDescription={item.description[rewardBoostLvl]}
      loading={loading}
      style={style}
      upgradeIcon={<Icon size="3x" icon="bolt" />}
    >
      <MaxLevelItemInfo
        icon="bolt"
        title="XP Video Reward Boost - Level 10"
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
