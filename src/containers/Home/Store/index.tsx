import React, { useEffect, useState } from 'react';
import KarmaStatus from './KarmaStatus';
import ItemPanel from './ItemPanel';
import ChangePassword from './ChangePassword';
import ChangeUsername from './ChangeUsername';
import FileSizeItem from './FileSizeItem';
import ProfilePictureItem from './ProfilePictureItem';
import AICardItem from './AICardItem';
import DonorLicenseItem from './DonorLicenseItem';
import Loading from '~/components/Loading';
import HomeLoginPrompt from '~/components/HomeLoginPrompt';
import { isSupermod } from '~/helpers';
import { useAppContext, useViewContext, useKeyContext } from '~/contexts';
import { priceTable } from '~/constants/defaultValues';
import RewardBoostItem from './RewardBoostItem';
import { css } from '@emotion/css';
import HomeSectionHeader from '~/components/HomeSectionHeader';

const changePasswordLabel = 'Change your password';
const changePasswordDescriptionLabel = 'Change your password anytime you want. This item is free';
const changeUsernameLabel = 'Change your username';
const changeUsernameDescriptionLabel = `Unlock this item to change your username anytime you want for ${priceTable.username} Twinkle Coins`;
const moreToComeLabel = 'More to come';
const settingsLabel = 'Settings';

const contentWrapperClass = css`
  display: flex;
  flex-direction: column;
  gap: 3rem;
  padding: 1rem 0;
`;

const headingMargin = { marginBottom: '2rem' } as React.CSSProperties;

export default function Store() {
  const loadMyData = useAppContext((v) => v.requestHelpers.loadMyData);
  const loadKarmaPoints = useAppContext(
    (v) => v.requestHelpers.loadKarmaPoints
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const level = useKeyContext((v) => v.myState.level);
  const title = useKeyContext((v) => v.myState.title);
  const userType = useKeyContext((v) => v.myState.userType);
  const canChangeUsername = useKeyContext((v) => v.myState.canChangeUsername);
  const canGenerateAICard = useKeyContext((v) => v.myState.canGenerateAICard);
  const canDonate = useKeyContext((v) => v.myState.canDonate);
  const donatedCoins = useKeyContext((v) => v.myState.donatedCoins);
  const karmaPoints = useKeyContext((v) => v.myState.karmaPoints);
  const userId = useKeyContext((v) => v.myState.userId);
  

  const unlockUsernameChange = useAppContext(
    (v) => v.requestHelpers.unlockUsernameChange
  );
  const pageVisible = useViewContext((v) => v.state.pageVisible);
  const [loading, setLoading] = useState(false);
  const [numTwinklesRewarded, setNumTwinklesRewarded] = useState(0);
  const [numPostsRewarded, setNumPostsRewarded] = useState(0);
  const [numRecommended, setNumRecommended] = useState(0);
  const [numApprovedRecommendations, setNumApprovedRecommendations] =
    useState(0);
  const [unlockingUsernameChange, setUnlockingUsernameChange] = useState(false);

  useEffect(() => {
    if (userId) {
      init();
    }

    async function init() {
      setLoading(true);
      try {
        const data = await loadMyData();
        const {
          karmaPoints: kp,
          numTwinklesRewarded,
          numApprovedRecommendations,
          numPostsRewarded,
          numRecommended
        } = await loadKarmaPoints();
        onSetUserState({
          userId: data.userId,
          newState: { ...data, karmaPoints: kp }
        });
        if (!isSupermod(level)) {
          setNumTwinklesRewarded(numTwinklesRewarded);
          setNumApprovedRecommendations(numApprovedRecommendations);
        } else {
          setNumPostsRewarded(numPostsRewarded);
          setNumRecommended(numRecommended);
        }
      } catch {
        console.error('error loading my data');
      } finally {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageVisible, userId]);

  return (
    <div style={{ paddingBottom: userId ? '15rem' : 0 }}>
      <HomeSectionHeader title={settingsLabel} style={headingMargin} />
      {!userId ? (
        <HomeLoginPrompt />
      ) : (
        <div className={contentWrapperClass}>
          <KarmaStatus
            karmaPoints={karmaPoints}
            level={level}
            loading={loading}
            numApprovedRecommendations={numApprovedRecommendations}
            numPostsRewarded={numPostsRewarded}
            numRecommended={numRecommended}
            numTwinklesRewarded={numTwinklesRewarded}
            title={title}
            userId={userId}
            userType={userType}
          />
          <ItemPanel
            itemKey="changePassword"
            itemName={changePasswordLabel}
            itemDescription={changePasswordDescriptionLabel}
            loading={loading}
          >
            <ChangePassword style={{ marginTop: '1rem' }} />
          </ItemPanel>
          {loading ? (
            <Loading />
          ) : (
            <>
              <ItemPanel
                karmaPoints={karmaPoints}
                locked={!canChangeUsername}
                itemKey="username"
                itemName={changeUsernameLabel}
                itemDescription={changeUsernameDescriptionLabel}
                onUnlock={handleUnlockUsernameChange}
                unlocking={unlockingUsernameChange}
                loading={loading}
              >
                <ChangeUsername style={{ marginTop: '1rem' }} />
              </ItemPanel>
              <RewardBoostItem loading={loading} />
              <FileSizeItem loading={loading} />
              <ProfilePictureItem loading={loading} />
              <AICardItem
                userId={userId}
                canGenerateAICard={!!canGenerateAICard}
                karmaPoints={karmaPoints}
                loading={loading}
              />
              <DonorLicenseItem
                karmaPoints={karmaPoints}
                loading={loading}
                canDonate={canDonate}
                donatedCoins={donatedCoins || 0}
              />
              <ItemPanel
                karmaPoints={karmaPoints}
                locked
                itemKey="moreToCome"
                itemName={`${moreToComeLabel}...`}
                loading={loading}
              />
            </>
          )}
        </div>
      )}
    </div>
  );

  async function handleUnlockUsernameChange() {
    setUnlockingUsernameChange(true);
    const success = await unlockUsernameChange();
    if (success) {
      onSetUserState({ userId, newState: { canChangeUsername: true } });
    }
    setUnlockingUsernameChange(false);
  }
}
