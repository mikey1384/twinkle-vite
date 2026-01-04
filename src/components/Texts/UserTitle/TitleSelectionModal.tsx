import React, { useEffect, useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import Button from '~/components/Button';
import DropdownButton from '~/components/Buttons/DropdownButton';
import Loading from '~/components/Loading';
import { capitalize } from '~/helpers/stringHelpers';
import { useAppContext, useKeyContext } from '~/contexts';

const cancelLabel = 'Cancel';
const confirmLabel = 'Confirm';

export default function TitleSelectionModal({
  currentTitle,
  modalOverModal,
  userLevel,
  onHide
}: {
  currentTitle: string;
  modalOverModal?: boolean;
  userLevel: number;
  onHide: () => void;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const loadUserTitles = useAppContext((v) => v.requestHelpers.loadUserTitles);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const updateUserTitle = useAppContext(
    (v) => v.requestHelpers.updateUserTitle
  );
  const [loading, setLoading] = useState(true);
  const [loadedTitles, setLoadedTitles] = useState<string[]>([]);
  const [dropdownShown, setDropdownShown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState(currentTitle);

  const menuProps = useMemo(() => {
    const rearrangedTitles = loadedTitles.filter(
      (title) => title !== selectedTitle
    );
    if (selectedTitle) rearrangedTitles.unshift(`level ${userLevel}`);
    return rearrangedTitles.map((title) => {
      return {
        label: <b>{capitalize(title)}</b>,
        onClick: () =>
          setSelectedTitle(title === `level ${userLevel}` ? '' : title)
      };
    });
  }, [loadedTitles, selectedTitle, userLevel]);

  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      const titles = await loadUserTitles();
      setLoadedTitles(titles || []);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal
      isOpen
      onClose={handleHide}
      modalLevel={2}
      hasHeader={false}
      bodyPadding={0}
    >
      <LegacyModalLayout>
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
                  variant="soft"
                  tone="raised"
                  icon="caret-down"
                  text={selectedTitle || `level ${userLevel}`}
                  onDropdownShown={setDropdownShown}
                  menuProps={menuProps}
                />
              </div>
            </div>
          )}
        </main>
        <footer>
          <Button
            variant="ghost"
            style={{ marginRight: '0.7rem' }}
            onClick={onHide}
          >
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
      </LegacyModalLayout>
    </Modal>
  );

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await updateUserTitle(selectedTitle);
      onSetUserState({ userId, newState: { title: selectedTitle } });
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
      onHide();
    }
  }

  function handleHide() {
    if (!dropdownShown) {
      onHide();
    }
  }
}
