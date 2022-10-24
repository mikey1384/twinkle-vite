import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import RewardLevelForm from '~/components/Forms/RewardLevelForm';
import RewardLevelExplainer from '~/components/RewardLevelExplainer';
import AlertModal from '~/components/Modals/AlertModal';
import { useAppContext, useKeyContext } from '~/contexts';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import localize from '~/constants/localize';

const cancelLabel = localize('cancel');
const setLabel = localize('set');
const settingCannotBeChangedLabel = localize('settingCannotBeChanged');
const setRewardLevelLabel = localize('setRewardLevel');

RewardLevelModal.propTypes = {
  contentId: PropTypes.number.isRequired,
  contentType: PropTypes.string.isRequired,
  rewardLevel: PropTypes.number,
  onHide: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

export default function RewardLevelModal({
  contentId,
  contentType,
  rewardLevel: initialRewardLevel = 0,
  onSubmit,
  onHide
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const updateRewardLevel = useAppContext(
    (v) => v.requestHelpers.updateRewardLevel
  );
  const [moderatorName, setModeratorName] = useState('');
  const [cannotChangeModalShown, setCannotChangeModalShown] = useState(false);
  const [posting, setPosting] = useState(false);
  const [rewardLevel, setRewardLevel] = useState(initialRewardLevel);

  const moderatorHasDisabledChangeLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return (
        <span>
          <b>{moderatorName}</b>님이 이 설정을 변경하지 못하도록 설정하였습니다
        </span>
      );
    }
    return (
      <span>
        <b>{moderatorName}</b> has disabled users from changing this setting for
        this post
      </span>
    );
  }, [moderatorName]);

  return (
    <Modal onHide={onHide}>
      <ErrorBoundary componentPath="RewardLevelModal">
        <header>{setRewardLevelLabel}</header>
        <main style={{ fontSize: '3rem', paddingTop: 0 }}>
          <RewardLevelExplainer
            style={{ marginTop: '5rem' }}
            rewardLevel={rewardLevel}
            type={contentType}
          />
          <RewardLevelForm
            rewardLevel={rewardLevel}
            onSetRewardLevel={setRewardLevel}
            style={{ marginTop: '3rem', textAlign: 'center' }}
          />
        </main>
        <footer>
          <Button
            transparent
            style={{ marginRight: '0.7rem' }}
            onClick={onHide}
          >
            {cancelLabel}
          </Button>
          <Button loading={posting} color={doneColor} onClick={submit}>
            {setLabel}
          </Button>
        </footer>
      </ErrorBoundary>
      {cannotChangeModalShown && (
        <AlertModal
          modalOverModal
          title={settingCannotBeChangedLabel}
          content={moderatorHasDisabledChangeLabel}
          onHide={() => setCannotChangeModalShown(false)}
        />
      )}
    </Modal>
  );

  async function submit() {
    setPosting(true);
    const { cannotChange, success, moderatorName } = await updateRewardLevel({
      contentId,
      contentType,
      rewardLevel
    });
    if (cannotChange) {
      setModeratorName(moderatorName);
      return setCannotChangeModalShown(true);
    }
    if (success) {
      onSubmit({ contentId, rewardLevel, contentType });
    }
  }
}
