import React, { useEffect, useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import DropdownButton from '~/components/Buttons/DropdownButton';
import Loading from '~/components/Loading';
import localize from '~/constants/localize';
import { capitalize } from '~/helpers/stringHelpers';
import { useAppContext, useKeyContext } from '~/contexts';

const cancelLabel = localize('cancel');
const confirmLabel = localize('confirm');

export default function TitleSelectionModal({
  currentTitle,
  modalOverModal,
  onHide
}: {
  currentTitle: string;
  modalOverModal?: boolean;
  onHide: () => void;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const loadUserTitles = useAppContext((v) => v.requestHelpers.loadUserTitles);
  const [loading, setLoading] = useState(true);
  const [loadedTitles, setLoadedTitles] = useState<string[]>([]);
  const [dropdownShown, setDropdownShown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState(currentTitle);

  const menuProps = useMemo(() => {
    const rearrangedTitles = loadedTitles.filter(
      (title) => title !== selectedTitle
    );
    return rearrangedTitles.map((title) => ({
      label: <b>{capitalize(title)}</b>,
      onClick: () => setSelectedTitle(title)
    }));
  }, [loadedTitles, selectedTitle]);

  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      const titles = await loadUserTitles();
      setLoadedTitles(titles);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal modalOverModal={modalOverModal} onHide={handleHide}>
      <header>Select Your Title</header>
      <main>
        {loading ? (
          <Loading />
        ) : (
          <div
            style={{
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div>
              <b>Title:</b>
            </div>
            <div style={{ marginLeft: '1rem' }}>
              <DropdownButton
                isMenuShownWhenMounted
                skeuomorphic
                icon="caret-down"
                text={selectedTitle}
                onDropdownShown={setDropdownShown}
                menuProps={menuProps}
              />
            </div>
          </div>
        )}
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          {cancelLabel}
        </Button>
        <Button
          disabled={selectedTitle === currentTitle}
          loading={submitting}
          color={doneColor}
          onClick={handleConfirm}
        >
          {confirmLabel}
        </Button>
      </footer>
    </Modal>
  );

  async function handleConfirm() {
    setSubmitting(true);
    console.log('confirming');
    setSubmitting(false);
  }

  function handleHide() {
    if (!dropdownShown) {
      onHide();
    }
  }
}
