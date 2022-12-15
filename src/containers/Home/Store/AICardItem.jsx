import PropTypes from 'prop-types';
import ItemPanel from './ItemPanel';
import MaxLevelItemInfo from './MaxLevelItemInfo';
import { Link } from 'react-router-dom';
import { karmaPointTable } from '~/constants/defaultValues';

AICardItem.propTypes = {
  canGenerateAICard: PropTypes.bool,
  style: PropTypes.object,
  karmaPoints: PropTypes.number
};

export default function AICardItem({ canGenerateAICard, karmaPoints, style }) {
  return (
    <ItemPanel
      karmaPoints={karmaPoints}
      requiredKarmaPoints={karmaPointTable.aiCard}
      locked={!canGenerateAICard}
      itemName="AI Card Summoner License"
      itemDescription="Become one of the special users who can summon AI Cards"
      onUnlock={() => console.log('unlocking')}
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
}
