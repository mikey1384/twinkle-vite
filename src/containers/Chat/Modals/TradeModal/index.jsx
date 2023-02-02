import { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import MyWant from './MyWant';
import MyOffer from './MyOffer';
import Options from './Options';
import SelectAICardModal from './SelectAICardModal';
import { useKeyContext } from '~/contexts';

TradeModal.propTypes = {
  isAICardModalShown: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  partner: PropTypes.object.isRequired
};

export default function TradeModal({
  isAICardModalShown,
  onHide,
  onSetAICardModalCardId,
  partner
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const [aiCardModalType, setAICardModalType] = useState(null);
  const [selectedOption, setSelectedOption] = useState('');

  return (
    <Modal onHide={isAICardModalShown ? null : onHide}>
      <header>Trade</header>
      <main>
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: !!selectedOption ? 0 : '2rem'
          }}
        >
          <Options
            onSelectOption={setSelectedOption}
            partnerName={partner?.username}
            selectedOption={selectedOption}
          />
          {selectedOption === 'want' ? (
            <MyWant
              style={{ marginTop: '3rem' }}
              onShowAICard={() => setAICardModalType('want')}
            />
          ) : null}
          {!!selectedOption && (
            <MyOffer
              selectedOption={selectedOption}
              style={{ marginTop: '3rem' }}
              onShowAICard={() => setAICardModalType('offer')}
            />
          )}
        </div>
      </main>
      <footer>
        <Button
          transparent
          style={{ marginRight: '0.7rem' }}
          onClick={isAICardModalShown ? null : onHide}
        >
          Cancel
        </Button>
        <Button disabled={true} color={doneColor} onClick={onHide}>
          Propose
        </Button>
      </footer>
      {!!aiCardModalType && (
        <SelectAICardModal
          aiCardModalType={aiCardModalType}
          partnerName={partner?.username}
          onSetAICardModalCardId={onSetAICardModalCardId}
          onSelectDone={handleSelectAICards}
          onHide={isAICardModalShown ? null : () => setAICardModalType(null)}
        />
      )}
    </Modal>
  );
  function handleSelectAICards(selectedCardIds) {
    console.log(selectedCardIds);
  }
}
