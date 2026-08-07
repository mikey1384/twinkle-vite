import React, { useEffect, useRef, useState } from 'react';
import KarmaStatus from './KarmaStatus';
import ItemPanel from './ItemPanel';
import ChangePassword from './ChangePassword';
import ChangeUsername from './ChangeUsername';
import ChatNotificationsItem from './ChatNotificationsItem';
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
import { useScrollAnchorRestoration } from '~/helpers/hooks/useScrollAnchorRestoration';

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
  const [myDataLoaded, setMyDataLoaded] = useState(false);
  const [karmaLoaded, setKarmaLoaded] = useState(false);
  const [numTwinklesRewarded, setNumTwinklesRewarded] = useState(0);
  const [numPostsRewarded, setNumPostsRewarded] = useState(0);
  const [numRecommended, setNumRecommended] = useState(0);
  const [numApprovedRecommendations, setNumApprovedRecommendations] =
    useState(0);
  const [unlockingUsernameChange, setUnlockingUsernameChange] = useState(false);
  const settingsListRef = useRef<HTMLDivElement | null>(null);
  // Section state belongs to one account and one request round. The generation
  // drops out-of-order responses; the owner id detects login/logout/switch so
  // the previous account's counters never render for the new one.
  const requestGenerationRef = useRef(0);
  const sectionsOwnerUserIdRef = useRef<number | null>(null);

  useScrollAnchorRestoration({
    anchorKey: 'home:settings',
    containerRef: settingsListRef,
    initialScroll: { type: 'top' },
    itemsReady: !!userId
  });

  useEffect(() => {
    const generation = ++requestGenerationRef.current;
    if (sectionsOwnerUserIdRef.current !== (userId || null)) {
      // Account identity changed: the loaded flags and counters describe the
      // previous account, so re-block both sections until this account's
      // canonical data arrives. A same-account visibility refresh keeps
      // showing the last canonical values while revalidating instead.
      sectionsOwnerUserIdRef.current = userId || null;
      setMyDataLoaded(false);
      setKarmaLoaded(false);
      setNumTwinklesRewarded(0);
      setNumPostsRewarded(0);
      setNumRecommended(0);
      setNumApprovedRecommendations(0);
    }
    if (userId) {
      initMyData();
      initKarma();
    }

    // The two requests run in parallel and each section unblocks as soon as
    // its own canonical data arrives: the item panels only need the session
    // data, so they must not wait for the karma recompute, which scans the
    // user's full reward history and is by far the slower call. Every
    // application (including the loaded flags) is generation-gated so a slow
    // response from a previous round or account can never land.
    async function initMyData() {
      try {
        // karmaPoints is owned by the karma request; the recomputed canonical
        // value must not be overwritten by the stored session copy when the
        // two responses race.
        const { karmaPoints: _staleKarmaPoints, ...data } = await loadMyData();
        if (generation !== requestGenerationRef.current) return;
        onSetUserState({
          userId: data.userId,
          newState: data
        });
        setMyDataLoaded(true);
      } catch {
        if (generation !== requestGenerationRef.current) return;
        console.error('error loading my data');
        setMyDataLoaded(true);
      }
    }

    async function initKarma() {
      try {
        const {
          karmaPoints: kp,
          numTwinklesRewarded,
          numApprovedRecommendations,
          numPostsRewarded,
          numRecommended
        } = await loadKarmaPoints();
        if (generation !== requestGenerationRef.current) return;
        onSetUserState({
          userId,
          newState: { karmaPoints: kp }
        });
        if (!isSupermod(level)) {
          setNumTwinklesRewarded(numTwinklesRewarded);
          setNumApprovedRecommendations(numApprovedRecommendations);
        } else {
          setNumPostsRewarded(numPostsRewarded);
          setNumRecommended(numRecommended);
        }
        setKarmaLoaded(true);
      } catch {
        if (generation !== requestGenerationRef.current) return;
        console.error('error loading karma points');
        setKarmaLoaded(true);
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
        <div ref={settingsListRef} className={contentWrapperClass}>
          <div data-scroll-anchor-id="home-settings:karma">
            <KarmaStatus
              karmaPoints={karmaPoints}
              level={level}
              loading={!karmaLoaded}
              numApprovedRecommendations={numApprovedRecommendations}
              numPostsRewarded={numPostsRewarded}
              numRecommended={numRecommended}
              numTwinklesRewarded={numTwinklesRewarded}
              title={title}
              userId={userId}
              userType={userType}
            />
          </div>
          <ChatNotificationsItem loading={!myDataLoaded} />
          <div data-scroll-anchor-id="home-settings:change-password">
            <ItemPanel
              itemKey="changePassword"
              itemName={changePasswordLabel}
              itemDescription={changePasswordDescriptionLabel}
              loading={!myDataLoaded}
            >
              <ChangePassword style={{ marginTop: '1rem' }} />
            </ItemPanel>
          </div>
          {!myDataLoaded ? (
            <Loading />
          ) : (
            <>
              <div data-scroll-anchor-id="home-settings:username">
                <ItemPanel
                  karmaPoints={karmaPoints}
                  locked={!canChangeUsername}
                  itemKey="username"
                  itemName={changeUsernameLabel}
                  itemDescription={changeUsernameDescriptionLabel}
                  onUnlock={handleUnlockUsernameChange}
                  unlocking={unlockingUsernameChange}
                  loading={!myDataLoaded}
                >
                  <ChangeUsername style={{ marginTop: '1rem' }} />
                </ItemPanel>
              </div>
              <div data-scroll-anchor-id="home-settings:reward-boost">
                <RewardBoostItem loading={!myDataLoaded} />
              </div>
              <div data-scroll-anchor-id="home-settings:file-size">
                <FileSizeItem loading={!myDataLoaded} />
              </div>
              <div data-scroll-anchor-id="home-settings:profile-picture">
                <ProfilePictureItem loading={!myDataLoaded} />
              </div>
              <div data-scroll-anchor-id="home-settings:ai-card">
                <AICardItem
                  userId={userId}
                  canGenerateAICard={!!canGenerateAICard}
                  karmaPoints={karmaPoints}
                  loading={!myDataLoaded}
                />
              </div>
              <div data-scroll-anchor-id="home-settings:donor-license">
                <DonorLicenseItem
                  karmaPoints={karmaPoints}
                  loading={!myDataLoaded}
                  canDonate={canDonate}
                  donatedCoins={donatedCoins || 0}
                />
              </div>
              <div data-scroll-anchor-id="home-settings:more">
                <ItemPanel
                  karmaPoints={karmaPoints}
                  locked
                  itemKey="moreToCome"
                  itemName={`${moreToComeLabel}...`}
                  loading={!myDataLoaded}
                />
              </div>
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
