import PropTypes from 'prop-types';
import Menu from './Menu';

OwnerMenu.propTypes = {
  burnXP: PropTypes.number.isRequired,
  xpNumberColor: PropTypes.string.isRequired,
  cardLevel: PropTypes.number.isRequired,
  cardQuality: PropTypes.string.isRequired,
  onBurnConfirm: PropTypes.func.isRequired,
  onSetSellModalShown: PropTypes.func.isRequired
};

export default function OwnerMenu({
  burnXP,
  cardLevel,
  cardQuality,
  onSetSellModalShown,
  onBurnConfirm,
  xpNumberColor
}) {
  return (
    <div style={{ width: '100%', marginTop: 0 }}>
      <Menu
        burnXP={burnXP}
        cardLevel={cardLevel}
        cardQuality={cardQuality}
        xpNumberColor={xpNumberColor}
        onBurnConfirm={onBurnConfirm}
        onSetSellModalShown={onSetSellModalShown}
      />
    </div>
  );
}
