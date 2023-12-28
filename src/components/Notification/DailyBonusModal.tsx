import React, { useEffect } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { useAppContext } from '~/contexts';

export default function DailyBonusModal({ onHide }: { onHide: () => void }) {
  const loadDailyBonus = useAppContext((v) => v.requestHelpers.loadDailyBonus);
  useEffect(() => {
    init();
    async function init() {
      const data = await loadDailyBonus();
      console.log(data);
    }
  });
  return (
    <Modal wrapped onHide={onHide}>
      <header>Daily Reward</header>
      <main>bonus reward</main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}
