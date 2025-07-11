import React, { useEffect, useState } from 'react';
import KarmaStatus from './KarmaStatus';
import ItemPanel from './ItemPanel';
import ChangePassword from './ChangePassword';
import ChangeUsername from './ChangeUsername';
import FileSizeItem from './FileSizeItem';
import ProfilePictureItem from './ProfilePictureItem';
import AICardItem from './AICardItem';
import Loading from '~/components/Loading';
import { isSupermod } from '~/helpers';
import { useAppContext, useViewContext, useKeyContext } from '~/contexts';
import { priceTable, SELECTED_LANGUAGE } from '~/constants/defaultValues';
import RewardBoostItem from './RewardBoostItem';
import localize from '~/constants/localize';

const changePasswordLabel = localize('changePassword');
const changePasswordDescriptionLabel = localize('changePasswordDescription');
const changeUsernameLabel = localize('changeUsername');
const changeUsernameDescriptionLabel =
  SELECTED_LANGUAGE === 'kr'
    ? `본 아이템을 잠금 해제 하시면 ${priceTable.username} 트윈클 코인 가격에 언제든 유저명을 바꾸실 수 있게 됩니다`
    : `Unlock this item to change your username anytime you want for ${priceTable.username} Twinkle Coins`;
const moreToComeLabel = localize('moreToCome');

export default function Store() {
  const loadMyData = useAppContext((v) => v.requestHelpers.loadMyData);
  const loadKarmaPoints = useAppContext(
    (v) => v.requestHelpers.loadKarmaPoints
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const {
    level,
    title,
    userType,
    canChangeUsername,
    canGenerateAICard,
    karmaPoints,
    userId
  } = useKeyContext((v) => v.myState);
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
    <div style={{ paddingBottom: '15rem' }}>
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
        style={{ marginTop: userId ? '4rem' : 0 }}
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
            style={{ marginTop: '3rem' }}
            loading={loading}
          >
            <ChangeUsername style={{ marginTop: '1rem' }} />
          </ItemPanel>
          <RewardBoostItem style={{ marginTop: '3rem' }} loading={loading} />
          <FileSizeItem style={{ marginTop: '3rem' }} loading={loading} />
          <ProfilePictureItem style={{ marginTop: '3rem' }} loading={loading} />
          <AICardItem
            style={{ marginTop: '3rem' }}
            userId={userId}
            canGenerateAICard={!!canGenerateAICard}
            karmaPoints={karmaPoints}
            loading={loading}
          />
          <ItemPanel
            karmaPoints={karmaPoints}
            locked
            itemKey="donate"
            itemName="donate"
            style={{ marginTop: '3rem' }}
            loading={loading}
          />
          <ItemPanel
            karmaPoints={karmaPoints}
            locked
            itemKey="moreToCome"
            itemName={`${moreToComeLabel}...`}
            style={{ marginTop: '3rem' }}
            loading={loading}
          />
        </>
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
