import { useEffect } from 'react';
import KarmaStatus from './KarmaStatus';
import ItemPanel from './ItemPanel';
import ChangePassword from './ChangePassword';
import ChangeUsername from './ChangeUsername';
import FileSizeItem from './FileSizeItem';
import ProfilePictureItem from './ProfilePictureItem';
import AICardItem from './AICardItem';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useAppContext, useViewContext, useKeyContext } from '~/contexts';
import {
  priceTable,
  karmaPointTable,
  SELECTED_LANGUAGE
} from '~/constants/defaultValues';
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

const welcomeMessageLabel =
  SELECTED_LANGUAGE === 'kr' ? (
    <>
      <span className="logo logo-twin">트윈</span>
      <span className="logo logo-kle">클</span> 스토어에 오신걸 환영합니다
    </>
  ) : (
    <>
      Welcome to <span className="logo logo-twin">Twin</span>
      <span className="logo logo-kle">kle</span> Store
    </>
  );

export default function Store() {
  const loadMyData = useAppContext((v) => v.requestHelpers.loadMyData);
  const unlockUsernameChange = useAppContext(
    (v) => v.requestHelpers.unlockUsernameChange
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const pageVisible = useViewContext((v) => v.state.pageVisible);
  const { canChangeUsername, canGenerateAICard, karmaPoints, userId } =
    useKeyContext((v) => v.myState);
  const {
    logoTwin: { color: twinColor },
    logoKle: { color: kleColor }
  } = useKeyContext((v) => v.theme);

  useEffect(() => {
    if (userId) {
      init();
    }

    async function init() {
      const data = await loadMyData();
      onSetUserState({ userId: data.userId, newState: data });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageVisible, userId]);

  return (
    <div style={{ paddingBottom: '15rem' }}>
      <div
        className={css`
          margin-bottom: 2rem;
          background: #fff;
          padding: 1rem;
          border: 1px solid ${Color.borderGray()};
          border-radius: ${borderRadius};
          @media (max-width: ${mobileMaxWidth}) {
            border-radius: 0;
            border-top: 0;
            border-left: 0;
            border-right: 0;
          }
        `}
      >
        <p
          className={css`
            font-size: 2rem;
            font-weight: bold;
            line-height: 1.5;
            color: ${Color.darkerGray()};
            > .logo {
              line-height: 1;
            }
            > .logo-twin {
              color: ${Color[twinColor]()};
            }
            > .logo-kle {
              color: ${Color[kleColor]()};
            }
          `}
          style={{ fontWeight: 'bold', fontSize: '2.5rem' }}
        >
          {welcomeMessageLabel}
        </p>
      </div>
      <KarmaStatus />
      <ItemPanel
        itemName={changePasswordLabel}
        style={{ marginTop: userId ? '4rem' : 0 }}
        itemDescription={changePasswordDescriptionLabel}
      >
        <ChangePassword style={{ marginTop: '1rem' }} />
      </ItemPanel>
      <ItemPanel
        karmaPoints={karmaPoints}
        requiredKarmaPoints={karmaPointTable.username}
        locked={!canChangeUsername}
        itemName={changeUsernameLabel}
        itemDescription={changeUsernameDescriptionLabel}
        onUnlock={handleUnlockUsernameChange}
        style={{ marginTop: '3rem' }}
      >
        <ChangeUsername style={{ marginTop: '1rem' }} />
      </ItemPanel>
      <RewardBoostItem style={{ marginTop: '3rem' }} />
      <FileSizeItem style={{ marginTop: '3rem' }} />
      <ProfilePictureItem style={{ marginTop: '3rem' }} />
      <AICardItem
        style={{ marginTop: '3rem' }}
        canGenerateAICard={canGenerateAICard}
        karmaPoints={karmaPoints}
      />
      <ItemPanel
        karmaPoints={karmaPoints}
        requiredKarmaPoints={30_000}
        locked
        itemName={`${moreToComeLabel}...`}
        style={{ marginTop: '3rem' }}
      />
    </div>
  );

  async function handleUnlockUsernameChange() {
    const success = await unlockUsernameChange();
    if (success) {
      onSetUserState({ userId, newState: { canChangeUsername: true } });
    }
  }
}
