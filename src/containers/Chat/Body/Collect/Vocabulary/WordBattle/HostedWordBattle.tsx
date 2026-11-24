import React, { useMemo } from 'react';
import Modal from '~/components/Modal';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext, useChatContext } from '~/contexts';
import BattleScreen, { BattleApi } from './BattleScreen';
import { HostedBattle, wordBattleHost } from './battleHost';

// The open word battle, shown by the app-level WordBattleHost (battleHost.ts)
// so nothing that happens to the card or window that opened it can close it.
export default function HostedWordBattle({ battle }: { battle: HostedBattle }) {
  const startWordBattle = useAppContext(
    (v) => v.requestHelpers.startWordBattle
  );
  const startWordRehunt = useAppContext(
    (v) => v.requestHelpers.startWordRehunt
  );
  const answerWordBattle = useAppContext(
    (v) => v.requestHelpers.answerWordBattle
  );
  const loadWordBattleAudio = useAppContext(
    (v) => v.requestHelpers.loadWordBattleAudio
  );
  const onUnlockWordDefinitions = useChatContext(
    (v) => v.actions.onUnlockWordDefinitions
  );
  const { id, rehunt = false, seenForm, state, word } = battle;

  const api: BattleApi = useMemo(
    () => ({
      start: async (wordId) => {
        try {
          return rehunt
            ? await startWordRehunt(wordId)
            : await startWordBattle(wordId, seenForm);
        } catch (error: any) {
          // Today's battles ran out since the gate loaded: back to the gate,
          // which now offers Capture or Just read it. (handleError rejects
          // with the server's error code as `message`.)
          if (error?.message === 'daily_limit') wordBattleHost.dailyLimit(id);
          throw error;
        }
      },
      answer: (args) =>
        answerWordBattle(rehunt ? { ...args, rehunt: true } : args),
      loadAudio: (args) =>
        loadWordBattleAudio(rehunt ? { ...args, rehunt: true } : args)
    }),
    [
      answerWordBattle,
      id,
      loadWordBattleAudio,
      rehunt,
      seenForm,
      startWordBattle,
      startWordRehunt
    ]
  );

  return (
    <ErrorBoundary componentPath="Chat/Body/Collect/Vocabulary/WordBattle/HostedWordBattle">
      <Modal
        modalKey="WordBattle"
        isOpen
        size="md"
        hasHeader={false}
        bodyPadding={0}
        closeOnBackdropClick={false}
        showCloseButton={false}
        xpActivity
        onClose={() => wordBattleHost.close(id)}
        aria-label={`${rehunt ? 'Re-hunt' : 'Battle'} ${word}`}
      >
        <BattleScreen
          initial={state}
          api={api}
          rehunt={rehunt}
          onClose={() => wordBattleHost.close(id)}
          onFinished={(finished) => {
            // Into Word Master's state here, so the definitions arrive even
            // when the gate that opened the battle is gone.
            if (finished.unlocked) onUnlockWordDefinitions(finished.unlocked);
            wordBattleHost.finish(id, finished);
          }}
        />
      </Modal>
    </ErrorBoundary>
  );
}
