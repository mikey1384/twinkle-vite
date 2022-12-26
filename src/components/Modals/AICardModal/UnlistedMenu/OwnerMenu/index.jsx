import { useState } from 'react';
import PropTypes from 'prop-types';
import FilterBar from '~/components/FilterBar';
import Menu from './Menu';
import Offers from './Offers';

OwnerMenu.propTypes = {
  burnXP: PropTypes.number.isRequired,
  cardId: PropTypes.number.isRequired,
  xpNumberColor: PropTypes.string.isRequired,
  cardLevel: PropTypes.number.isRequired,
  cardQuality: PropTypes.string.isRequired,
  onBurnConfirm: PropTypes.func.isRequired,
  onSetSellModalShown: PropTypes.func.isRequired
};

export default function OwnerMenu({
  burnXP,
  cardId,
  cardLevel,
  cardQuality,
  onSetSellModalShown,
  onBurnConfirm,
  xpNumberColor
}) {
  const [activeTab, setActiveTab] = useState('myMenu');
  return (
    <div style={{ width: '100%', marginTop: '-3rem' }}>
      <FilterBar style={{ height: '4.5rem', fontSize: '1.5rem' }}>
        <nav
          className={activeTab === 'myMenu' ? 'active' : ''}
          onClick={() => setActiveTab('myMenu')}
        >
          Menu
        </nav>
        <nav
          className={activeTab === 'offers' ? 'active' : ''}
          onClick={() => setActiveTab('offers')}
        >
          Offers
        </nav>
      </FilterBar>
      {activeTab === 'myMenu' ? (
        <Menu
          burnXP={burnXP}
          cardLevel={cardLevel}
          cardQuality={cardQuality}
          xpNumberColor={xpNumberColor}
          onBurnConfirm={onBurnConfirm}
          onSetSellModalShown={onSetSellModalShown}
        />
      ) : (
        <Offers cardId={cardId} />
      )}
    </div>
  );
}
