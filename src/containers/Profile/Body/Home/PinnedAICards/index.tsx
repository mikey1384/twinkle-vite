import React, { useEffect, useMemo, useState } from 'react';
import SectionPanel from '~/components/SectionPanel';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import AICardsPreview from '~/components/AICardsPreview';
import AICardModal from '~/components/Modals/AICardModal';
import SelectAICardModal from '~/components/Modals/SelectAICardModal';
import ErrorBoundary from '~/components/ErrorBoundary';
import {
  useAppContext,
  useChatContext,
  useKeyContext,
  useProfileContext
} from '~/contexts';
import { useProfileState } from '~/helpers/hooks';

const pinnedLabel = 'AI Cards';
const pinCardsLabel = 'Pin Cards';
const emptyLabel = 'No pinned AI cards yet';
const emptyOwnLabel = 'Pin your favorite AI cards to show them here';
const MAX_PINNED_AI_CARDS = 10;

export default function PinnedAICards({
  profile,
  selectedTheme
}: {
  profile: any;
  selectedTheme: string;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const isOwnProfile = userId === profile.id;
  const { pinnedAICards: cachedPinnedAICards } = useProfileState(
    profile.username
  );
  const loadPinnedAICardsOnProfile = useAppContext(
    (v) => v.requestHelpers.loadPinnedAICardsOnProfile
  );
  const pinAICardsOnProfile = useAppContext(
    (v) => v.requestHelpers.pinAICardsOnProfile
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onLoadPinnedAICards = useProfileContext(
    (v) => v.actions.onLoadPinnedAICards
  );
  const onSetPinnedAICards = useProfileContext(
    (v) => v.actions.onSetPinnedAICards
  );
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const [selectModalShown, setSelectModalShown] = useState(false);
  const [aiCardModalCardId, setAICardModalCardId] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [displayedCardIds, setDisplayedCardIds] = useState<number[]>([]);

  const pinnedCardIds = useMemo(() => {
    const ids = profile?.state?.profile?.pinnedAICardIds;
    if (!Array.isArray(ids)) return [];
    return ids
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);
  }, [profile?.state?.profile?.pinnedAICardIds]);
  const pinnedCardIdsKey = useMemo(
    () => pinnedCardIds.join(','),
    [pinnedCardIds]
  );
  const cachedCardIds = useMemo(() => {
    const ids = cachedPinnedAICards?.cardIds;
    if (!Array.isArray(ids)) return [];
    return ids
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);
  }, [cachedPinnedAICards?.cardIds]);
  const cachedCardIdsKey = useMemo(
    () => cachedCardIds.join(','),
    [cachedCardIds]
  );
  const hasCachedPinnedCards =
    cachedPinnedAICards?.loaded && cachedCardIdsKey === pinnedCardIdsKey;

  useEffect(() => {
    if (hasCachedPinnedCards) {
      setDisplayedCardIds(cachedCardIds);
      return;
    }
    // Reset to empty when profile changes - wait for API validation
    // This prevents showing previous profile's cards
    setDisplayedCardIds([]);
  }, [cachedCardIds, hasCachedPinnedCards, pinnedCardIdsKey, profile?.id]);

  useEffect(() => {
    let isMounted = true;
    if (!profile?.id) {
      setLoading(false);
      return;
    }
    if (pinnedCardIds.length === 0) {
      setLoading(false);
      if (!hasCachedPinnedCards) {
        onLoadPinnedAICards({ username: profile.username, cardIds: [] });
      }
      return;
    }
    if (hasCachedPinnedCards) {
      setLoading(false);
      return;
    }
    loadPinnedCards();
    async function loadPinnedCards() {
      setLoading(true);
      try {
        const data = await loadPinnedAICardsOnProfile(profile.id);
        if (!isMounted) return;
        const nextCardIds = Array.isArray(data?.cardIds)
          ? data.cardIds
          : pinnedCardIds;
        setDisplayedCardIds(nextCardIds);
        onLoadPinnedAICards({
          username: profile.username,
          cardIds: nextCardIds
        });
        // Sync user state if backend cleaned up invalid cards
        if (
          Array.isArray(data?.cardIds) &&
          data.cardIds.length !== pinnedCardIds.length
        ) {
          const nextState = {
            ...(profile.state || {}),
            profile: {
              ...(profile.state?.profile || {}),
              pinnedAICardIds: nextCardIds
            }
          };
          onSetUserState({
            userId: profile.id,
            newState: { state: nextState }
          });
        }
        for (const card of data?.cards || []) {
          onUpdateAICard({ cardId: card.id, newState: card });
        }
      } catch (error) {
        console.error(error);
        // Fallback to unvalidated IDs on error to avoid blank UI
        if (isMounted && displayedCardIds.length === 0) {
          setDisplayedCardIds(pinnedCardIds);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hasCachedPinnedCards,
    pinnedCardIds,
    pinnedCardIdsKey,
    profile?.id,
    profile?.username
  ]);

  const hasPinnedCards = displayedCardIds.length > 0;
  const buttonLabel = isOwnProfile
    ? `${pinCardsLabel} (${displayedCardIds.length}/${MAX_PINNED_AI_CARDS})`
    : '';

  if (!isOwnProfile && !hasPinnedCards && !loading) {
    return null;
  }

  return (
    <ErrorBoundary componentPath="Profile/Body/Home/PinnedAICards/index">
      <SectionPanel
        elevated
        loaded={!loading}
        customColorTheme={selectedTheme}
        title={pinnedLabel}
        isEmpty={!hasPinnedCards}
        emptyMessage={isOwnProfile ? emptyOwnLabel : emptyLabel}
        button={
          isOwnProfile ? (
            <Button
              color="darkerGray"
              variant="solid"
              tone="raised"
              onClick={() => setSelectModalShown(true)}
            >
              <Icon icon={['fas', 'thumbtack']} />
              <span style={{ marginLeft: '0.7rem' }}>{buttonLabel}</span>
            </Button>
          ) : null
        }
      >
        {hasPinnedCards && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <AICardsPreview
              isAICardModalShown={!!aiCardModalCardId}
              cardIds={displayedCardIds}
              exploreUrl={`/ai-cards/?search[owner]=${profile.username}`}
              moreAICardsModalTitle={`${profile.username}'s AI Cards`}
              onSetAICardModalCardId={setAICardModalCardId}
              themeColor={selectedTheme}
            />
          </div>
        )}
      </SectionPanel>
      {selectModalShown && (
        <SelectAICardModal
          aiCardModalType="offer"
          currentlySelectedCardIds={displayedCardIds}
          onHide={() => setSelectModalShown(false)}
          onSetAICardModalCardId={setAICardModalCardId}
          onSelectDone={handlePinAICards}
          onDropdownShown={() => {}}
          partner={{ id: profile.id, username: profile.username }}
          maxSelectedCards={MAX_PINNED_AI_CARDS}
          allowEmptySelection
        />
      )}
      {aiCardModalCardId && (
        <AICardModal
          modalOverModal={selectModalShown}
          cardId={aiCardModalCardId}
          onHide={() => setAICardModalCardId(null)}
        />
      )}
    </ErrorBoundary>
  );

  async function handlePinAICards(cardIds: number[]) {
    try {
      const data = await pinAICardsOnProfile({ cardIds });
      const nextCardIds = Array.isArray(data?.cardIds) ? data.cardIds : cardIds;
      const nextState = {
        ...(profile.state || {}),
        profile: {
          ...(profile.state?.profile || {}),
          pinnedAICardIds: nextCardIds
        }
      };
      onSetUserState({
        userId: profile.id,
        newState: { state: nextState }
      });
      onSetPinnedAICards({
        username: profile.username,
        cardIds: nextCardIds
      });
      setDisplayedCardIds(nextCardIds);
      setSelectModalShown(false);
    } catch (error) {
      console.error(error);
    }
  }
}
