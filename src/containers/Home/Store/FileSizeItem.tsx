import React from 'react';
import ItemPanel from './ItemPanel';
import Icon from '~/components/Icon';
import MaxLevelItemInfo from './MaxLevelItemInfo';
import { useAppContext, useKeyContext } from '~/contexts';
import {
  translateMBToGB,
  translateMBToGBWithoutSpace
} from '~/helpers/stringHelpers';
import { maxSizes, SELECTED_LANGUAGE } from '~/constants/defaultValues';
import localize from '~/constants/localize';

const expandMaximumUploadSizeLabel = localize('expandMaximumUploadSize');
const maximumUploadSizeLabel = localize('maximumUploadSize');

const item = {
  maxLvl: 7,
  name: [
    expandMaximumUploadSizeLabel,
    `${expandMaximumUploadSizeLabel} (level 2)`,
    `${expandMaximumUploadSizeLabel} (level 3)`,
    `${expandMaximumUploadSizeLabel} (level 4)`,
    `${expandMaximumUploadSizeLabel} (level 5)`,
    `${expandMaximumUploadSizeLabel} (level 6)`,
    `${expandMaximumUploadSizeLabel} (level 7)`
  ],
  description: maxSizes.map((currentSize, index) => {
    if (index === 0) {
      if (SELECTED_LANGUAGE === 'kr') {
        return `본 아이템을 잠금 해제 하시면 파일 업로드 용량 최대치를 ${translateMBToGBWithoutSpace(
          maxSizes[1]
        )}까지 확장하실 수 있습니다 (현재 ${translateMBToGBWithoutSpace(
          currentSize
        )})`;
      }
      return `Unlock this item to expand your maximum upload file size to ${translateMBToGB(
        maxSizes[1]
      )} (from ${translateMBToGB(currentSize)})`;
    }
    if (SELECTED_LANGUAGE === 'kr') {
      return `본 아이템을 업그레이드 하시면 파일 업로드 용량 최대치를 ${translateMBToGBWithoutSpace(
        maxSizes[index + 1]
      )}까지 확장하실 수 있습니다 (현재 ${translateMBToGBWithoutSpace(
        currentSize
      )})`;
    }
    return `Upgrade this item to expand your maximum upload file size to ${translateMBToGB(
      maxSizes[index + 1]
    )} (from ${translateMBToGB(currentSize)})`;
  })
};

const youCanNowUploadLabel =
  SELECTED_LANGUAGE === 'kr'
    ? `이제 최대 ${translateMBToGBWithoutSpace(
        maxSizes[maxSizes.length - 1]
      )}까지 업로드 가능합니다`
    : `You can now upload files up to ${translateMBToGB(
        maxSizes[maxSizes.length - 1]
      )} in size`;

export default function FileSizeItem({
  loading,
  style
}: {
  loading?: boolean;
  style?: React.CSSProperties;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const fileUploadLvl = useKeyContext((v) => v.myState.fileUploadLvl) || 0;
  const karmaPoints = useKeyContext((v) => v.myState.karmaPoints) || 0;
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const upgradeFileUploadSize = useAppContext(
    (v) => v.requestHelpers.upgradeFileUploadSize
  );
  return (
    <ItemPanel
      isLeveled
      currentLvl={fileUploadLvl}
      maxLvl={item.maxLvl}
      karmaPoints={karmaPoints}
      locked={!fileUploadLvl}
      loading={loading}
      onUnlock={handleUpgrade}
      itemKey="file"
      itemName={item.name[fileUploadLvl]}
      itemDescription={item.description[fileUploadLvl]}
      style={style}
      upgradeIcon={<Icon size="3x" icon="upload" />}
    >
      <MaxLevelItemInfo
        icon="upload"
        title={`${maximumUploadSizeLabel} - Level 7`}
        description={youCanNowUploadLabel}
      />
    </ItemPanel>
  );

  async function handleUpgrade() {
    const success = await upgradeFileUploadSize();
    if (success) {
      onSetUserState({
        userId,
        newState: { fileUploadLvl: fileUploadLvl + 1 }
      });
    }
  }
}
