import React, { useMemo, useState } from 'react';
import ItemPanel from './ItemPanel';
import Icon from '~/components/Icon';
import MaxLevelItemInfo from './MaxLevelItemInfo';
import { useAppContext, useKeyContext } from '~/contexts';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import localize from '~/constants/localize';

const profilePicturesLabel = localize('profilePictures');
const postPicturesOnYourProfilePageLabel = localize(
  'postPicturesOnYourProfilePage'
);

const item = {
  maxLvl: 7,
  name: [
    postPicturesOnYourProfilePageLabel,
    `${postPicturesOnYourProfilePageLabel} (level 2)`,
    `${postPicturesOnYourProfilePageLabel} (level 3)`,
    `${postPicturesOnYourProfilePageLabel} (level 4)`,
    `${postPicturesOnYourProfilePageLabel} (level 5)`,
    `${postPicturesOnYourProfilePageLabel} (level 6)`,
    `${postPicturesOnYourProfilePageLabel} (level 7)`
  ]
};

export default function ProfilePictureItem({
  loading,
  style
}: {
  loading?: boolean;
  style?: React.CSSProperties;
}) {
  const [unlocking, setUnlocking] = useState(false);
  const karmaPoints = useKeyContext((v) => v.myState.karmaPoints);
  const numPics = useKeyContext((v) => v.myState.numPics) || 0;
  const userId = useKeyContext((v) => v.myState.userId);
  const upgradeNumPics = useAppContext((v) => v.requestHelpers.upgradeNumPics);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const descriptionLabel = useMemo(() => {
    if (numPics > 0) {
      if (SELECTED_LANGUAGE === 'kr') {
        return `본 아이템을 업그레이드 하시면 프로필 페이지에 사진을 ${
          numPics + 1
        }장까지 게시하실 수 있게 됩니다`;
      }
      return `Upgrade this item to post up to ${
        numPics + 1
      } pictures on your profile page`;
    }
    if (SELECTED_LANGUAGE === 'kr') {
      return '본 아이템을 잠금 해제 하시면 프로필 페이지에 사진을 게시하실 수 있게 됩니다';
    }
    return 'Unlock this item to post pictures on your profile page';
  }, [numPics]);
  const youCanNowPostUpToLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return `이제 프로필 페이지에 사진을 최대 ${numPics}장까지 게시할 수 있습니다`;
    }
    return `You can now post up to ${numPics} pictures on your profile page`;
  }, [numPics]);

  return (
    <ItemPanel
      isLeveled
      currentLvl={numPics}
      maxLvl={item.maxLvl}
      karmaPoints={karmaPoints}
      locked={!numPics}
      loading={loading}
      onUnlock={handleUpgrade}
      unlocking={unlocking}
      itemKey="profilePicture"
      itemName={item.name[numPics]}
      itemDescription={descriptionLabel}
      style={style}
      upgradeIcon={<Icon size="3x" icon="image" />}
    >
      <MaxLevelItemInfo
        icon="image"
        title={`${profilePicturesLabel} - Level 7`}
        description={youCanNowPostUpToLabel}
      />
    </ItemPanel>
  );

  async function handleUpgrade() {
    setUnlocking(true);
    try {
      const success = await upgradeNumPics();
      if (success) {
        onSetUserState({ userId, newState: { numPics: numPics + 1 } });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUnlocking(false);
    }
  }
}
