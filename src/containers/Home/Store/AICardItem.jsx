import PropTypes from 'prop-types';
import ItemPanel from './ItemPanel';
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
    />
  );
}
