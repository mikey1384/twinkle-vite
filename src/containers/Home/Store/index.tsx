import React, { useEffect, useMemo, useState } from 'react';
import KarmaStatus from './KarmaStatus';
import ItemPanel from './ItemPanel';
import ChangePassword from './ChangePassword';
import ChangeUsername from './ChangeUsername';
import FileSizeItem from './FileSizeItem';
import ProfilePictureItem from './ProfilePictureItem';
import AICardItem from './AICardItem';
import DonorLicenseItem from './DonorLicenseItem';
import Loading from '~/components/Loading';
import { isSupermod } from '~/helpers';
import { useAppContext, useViewContext, useKeyContext } from '~/contexts';
import { priceTable, SELECTED_LANGUAGE } from '~/constants/defaultValues';
import RewardBoostItem from './RewardBoostItem';
import localize from '~/constants/localize';
import { css, cx } from '@emotion/css';
import { Color } from '~/constants/css';
import { homePanelClass } from '~/theme/homePanels';
import { getThemeRoles, ThemeName } from '~/theme/themes';

const changePasswordLabel = localize('changePassword');
const changePasswordDescriptionLabel = localize('changePasswordDescription');
const changeUsernameLabel = localize('changeUsername');
const changeUsernameDescriptionLabel =
  SELECTED_LANGUAGE === 'kr'
    ? `본 아이템을 잠금 해제 하시면 ${priceTable.username} 트윈클 코인 가격에 언제든 유저명을 바꾸실 수 있게 됩니다`
    : `Unlock this item to change your username anytime you want for ${priceTable.username} Twinkle Coins`;
const moreToComeLabel = localize('moreToCome');
const settingsLabel = localize('settings');

const contentWrapperClass = css`
  display: flex;
  flex-direction: column;
  gap: 3rem;
  padding: 1rem 0;
`;

const headingPanelExtraClass = css`
  margin-bottom: 2rem;
  padding: 1.6rem 2rem;
`;

const headingLabelClass = css`
  font-size: 2rem;
  font-weight: bold;
  line-height: 1.5;
`;

const loginPromptClass = css`
  text-align: center;
  font-size: 2.3rem;
  font-weight: bold;
  color: ${Color.black()};
  margin-top: 17vh;
`;

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
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);

  const themeName = useMemo<ThemeName>(
    () => ((profileTheme || 'logoBlue') as ThemeName),
    [profileTheme]
  );
  const themeRoles = useMemo(() => getThemeRoles(themeName), [themeName]);
  const headingColor = useMemo(() => {
    const colorKey = themeRoles.sectionPanelText?.color as
      | keyof typeof Color
      | undefined;
    const fn =
      colorKey && (Color[colorKey] as ((opacity?: number) => string) | undefined);
    return fn ? fn() : Color.darkerGray();
  }, [themeRoles.sectionPanelText?.color]);
  const headingPanelStyle = useMemo(
    () =>
      ({
        ['--home-panel-bg' as const]: '#ffffff',
        ['--home-panel-tint' as const]: Color.logoBlue(0.08),
        ['--home-panel-border' as const]: Color.borderGray(0.65),
        ['--home-panel-heading' as const]: headingColor,
        ['--home-panel-padding' as const]: '1.6rem 2rem',
        ['--home-panel-mobile-padding' as const]: '1.4rem 1.6rem'
      }) as React.CSSProperties,
    [headingColor]
  );

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
      <div
        className={cx(homePanelClass, headingPanelExtraClass)}
        style={headingPanelStyle}
      >
        <p
          className={headingLabelClass}
          style={{ fontWeight: 'bold', fontSize: '2.5rem' }}
        >
          {settingsLabel}
        </p>
      </div>
      {!userId ? (
        <div className={loginPromptClass}>Please log in to view this page</div>
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
