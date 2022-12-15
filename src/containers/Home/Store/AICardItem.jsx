import { useState } from 'react';
import PropTypes from 'prop-types';
import ItemPanel from './ItemPanel';
import MaxLevelItemInfo from './MaxLevelItemInfo';
import { Link } from 'react-router-dom';
import { useAppContext } from '~/contexts';
import { karmaPointTable } from '~/constants/defaultValues';

AICardItem.propTypes = {
  canGenerateAICard: PropTypes.bool,
  style: PropTypes.object,
  karmaPoints: PropTypes.number,
  userId: PropTypes.number
};

export default function AICardItem({
  canGenerateAICard,
  karmaPoints,
  style,
  userId
}) {
  const [unlocking, setUnlocking] = useState(false);
  const unlockAICardGeneration = useAppContext(
    (v) => v.requestHelpers.unlockAICardGeneration
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);

  return (
    <ItemPanel
      karmaPoints={karmaPoints}
      requiredKarmaPoints={karmaPointTable.aiCard}
      locked={!canGenerateAICard}
      itemName="AI Card Summoner License"
      itemDescription="Become one of the special users who can summon AI Cards"
      onUnlock={handleUnlock}
      unlocking={unlocking}
      style={style}
    >
      <MaxLevelItemInfo
        icon="cards-blank"
        title="License Acquired"
        description={
          <div style={{ marginTop: '1rem' }}>
            <div>You can now summon AI Cards from here:</div>
            <div style={{ marginTop: '1rem' }}>
              <Link style={{ fontWeight: 'bold' }} to="/chat/ai-image-cards">
                AI Card Collector
              </Link>
            </div>
          </div>
        }
      />
    </ItemPanel>
  );

  async function handleUnlock() {
    setUnlocking(true);
    const success = await unlockAICardGeneration();
    if (success) {
      onSetUserState({ userId, newState: { canGenerateAICard: true } });
    }
    setUnlocking(false);
  }
}
