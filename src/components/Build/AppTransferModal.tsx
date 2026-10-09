import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import UserSearchInput, {
  type UserSearchResult
} from '~/components/UserSearchInput';
import AICardModal from '~/components/Modals/AICardModal';
import TransactionModal from '~/containers/Chat/Modals/TransactionModal';
import TradeBuilds, {
  AppOwnershipNotice,
  type TradeBuild
} from './TradeBuilds';
import { useKeyContext } from '~/contexts';

export default function AppTransferModal({
  build,
  onHide
}: {
  build: TradeBuild & { userId: number; username: string };
  onHide: () => void;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const isOwner = Number(build.userId) === userId;
  const [partner, setPartner] = useState<UserSearchResult | null>(
    isOwner ? null : { id: build.userId, username: build.username }
  );
  const [mode, setMode] = useState<'want' | 'send'>('want');
  const [started, setStarted] = useState(!isOwner);
  const [groupObjs, setGroupObjs] = useState<Record<number, any>>({});
  const [cardId, setCardId] = useState(0);
  return (
    <>
      {started && partner ? (
        <TransactionModal
          initialBuild={build}
          initialOption={mode}
          partner={partner}
          currentTransactionId={0}
          channelId={0}
          groupObjs={groupObjs}
          onSetGroupObjs={setGroupObjs}
          isAICardModalShown={!!cardId}
          onSetAICardModalCardId={setCardId}
          onHide={onHide}
        />
      ) : (
        <Modal
          modalKey="AppTransfer"
          isOpen
          title="Sell or give your app"
          onClose={onHide}
          footer={
            <>
              <Button variant="ghost" onClick={onHide}>
                Cancel
              </Button>
              <Button
                color={doneColor}
                disabled={!partner}
                onClick={() => setStarted(true)}
              >
                Continue
              </Button>
            </>
          }
        >
          <div style={{ width: '100%', minWidth: 0 }}>
            <TradeBuilds builds={[build]} />
            <AppOwnershipNotice />
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '1rem',
                margin: '1.6rem 0'
              }}
            >
              <Button
                color={doneColor}
                variant={mode === 'want' ? 'solid' : 'soft'}
                onClick={() => setMode('want')}
              >
                Sell or trade
              </Button>
              <Button
                color={doneColor}
                variant={mode === 'send' ? 'solid' : 'soft'}
                onClick={() => setMode('send')}
              >
                Give as a gift
              </Button>
            </div>
            <p>
              Choose who you want to{' '}
              {mode === 'send' ? 'give this app to' : 'trade with'}.
            </p>
            <UserSearchInput
              excludeUserIds={[userId]}
              onSelect={setPartner}
              placeholder="Search by username"
            />
            {partner && (
              <p>
                Selected: <strong>{partner.username}</strong>
              </p>
            )}
          </div>
        </Modal>
      )}
      {!!cardId && (
        <AICardModal
          cardId={cardId}
          modalOverModal
          onHide={() => setCardId(0)}
        />
      )}
    </>
  );
}
