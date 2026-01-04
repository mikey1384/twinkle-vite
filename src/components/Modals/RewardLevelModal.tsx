import React, { useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import RewardLevelForm from '~/components/Forms/RewardLevelForm';
import RewardLevelExplainer from '~/components/RewardLevelExplainer';
import AlertModal from '~/components/Modals/AlertModal';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import { useRoleColor } from '~/theme/useRoleColor';

const cancelLabel = 'Cancel';
const setLabel = 'Set';
const settingCannotBeChangedLabel = 'This setting cannot be changed';
const setRewardLevelLabel = 'Set Effort Level';

export default function RewardLevelModal({
  contentId,
  contentType,
  rewardLevel: initialRewardLevel = 0,
  onSubmit,
  onHide
}: {
  contentId: number;
  contentType: string;
  rewardLevel?: number;
  onSubmit: (params: object) => void;
  onHide: () => void;
}) {
  const { colorKey: doneColorKey } = useRoleColor('done', {
    fallback: 'blue'
  });
  const updateRewardLevel = useAppContext(
    (v) => v.requestHelpers.updateRewardLevel
  );
  const [moderatorName, setModeratorName] = useState('');
  const [cannotChangeModalShown, setCannotChangeModalShown] = useState(false);
  const [posting, setPosting] = useState(false);
  const [rewardLevel, setRewardLevel] = useState(initialRewardLevel);

  const moderatorHasDisabledChangeLabel = useMemo(() => {
    return (
      <span>
        <b>{moderatorName}</b> has disabled users from changing this setting for
        this post
      </span>
    );
  }, [moderatorName]);

  return (
    <Modal isOpen onClose={onHide} hasHeader={false} bodyPadding={0}>
      <LegacyModalLayout>
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
              variant="ghost"
              style={{ marginRight: '0.7rem' }}
              onClick={onHide}
            >
              {cancelLabel}
            </Button>
            <Button
              loading={posting}
              color={
                doneColorKey && doneColorKey in Color ? doneColorKey : 'blue'
              }
              onClick={submit}
            >
              {setLabel}
            </Button>
          </footer>
        </ErrorBoundary>
        {cannotChangeModalShown && (
          <AlertModal
            title={settingCannotBeChangedLabel}
            content={moderatorHasDisabledChangeLabel}
            onHide={() => setCannotChangeModalShown(false)}
          />
        )}
      </LegacyModalLayout>
    </Modal>
  );

  async function submit() {
    setPosting(true);
    try {
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
    } catch (error) {
      console.error(error);
    } finally {
      setPosting(false);
    }
  }
}
