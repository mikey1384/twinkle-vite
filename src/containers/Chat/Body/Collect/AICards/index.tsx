import React, { useEffect, useMemo, useState } from 'react';
import GenerateCardInterface from './GenerateCardInterface';
import FilterBar from '~/components/FilterBar';
import ActivitiesContainer from './ActivitiesContainer';
import Loading from '~/components/Loading';
import { Link, useNavigate } from 'react-router-dom';
import { Color, mobileMaxWidth } from '~/constants/css';
import { VOCAB_CHAT_TYPE } from '~/constants/defaultValues';
import {
  useAppContext,
  useChatContext,
  useKeyContext,
  useNotiContext
} from '~/contexts';
import { css } from '@emotion/css';
import StatusInterface from './StatusInterface';
import AiEnergyDashboardModal from '~/components/AiEnergyDashboardModal';
import type { AiEnergyDisplayPolicy } from '~/helpers/aiEnergyDisplay';
import { trackEvent } from '~/helpers/analytics';

const aiCardControlTrayMobileBottomClearance =
  'calc(2rem + env(safe-area-inset-bottom, 0px))';

const aiCardControlTrayCls = css`
  flex-shrink: 0;
  max-height: 45%;
  background: ${Color.inputGray()};
  padding: 1rem;
  border-top: 1px solid var(--ui-border);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  @media (max-width: ${mobileMaxWidth}) {
    padding-bottom: ${aiCardControlTrayMobileBottomClearance};
    scroll-padding-bottom: ${aiCardControlTrayMobileBottomClearance};
  }
`;

export default function AICards({
  displayedThemeColor,
  loadingAICardChat
}: {
  displayedThemeColor: string;
  loadingAICardChat: boolean;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const canGenerateAICard = useKeyContext((v) => v.myState.canGenerateAICard);
  const generateAICard = useAppContext((v) => v.requestHelpers.generateAICard);
  const getAiEnergyPolicy = useAppContext(
    (v) => v.requestHelpers.getAiEnergyPolicy
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onSetCollectType = useAppContext(
    (v) => v.user.actions.onSetCollectType
  );
  const onUpdateNumSummoned = useChatContext(
    (v) => v.actions.onUpdateNumSummoned
  );
  const aiCardStatusMessage = useChatContext(
    (v) => v.state.aiCardStatusMessage
  );
  const isGeneratingAICard = useChatContext((v) => v.state.isGeneratingAICard);
  const numCardSummonedToday = useChatContext(
    (v) => v.state.numCardSummonedToday
  );
  const onSetIsGeneratingAICard = useChatContext(
    (v) => v.actions.onSetIsGeneratingAICard
  );
  const onSetAICardStatusMessage = useChatContext(
    (v) => v.actions.onSetAICardStatusMessage
  );
  const onPostAICardFeed = useChatContext((v) => v.actions.onPostAICardFeed);
  const globalAiUsagePolicy = useNotiContext(
    (v) => v.state.todayStats.aiUsagePolicy as AiEnergyDisplayPolicy | null
  );
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const [aiUsagePolicy, setAiUsagePolicy] = useState<AiEnergyDisplayPolicy | null>(
    globalAiUsagePolicy || null
  );
  const [aiUsagePolicyLoading, setAiUsagePolicyLoading] = useState(false);
  const [energyDashboardShown, setEnergyDashboardShown] = useState(false);
  const navigate = useNavigate();
  const energyDepleted = useMemo(() => {
    return (
      !!aiUsagePolicy &&
      typeof aiUsagePolicy.energyRemaining === 'number' &&
      aiUsagePolicy.energyRemaining <= 0
    );
  }, [aiUsagePolicy]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    loadAiUsagePolicy({ isCancelled: () => cancelled });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (globalAiUsagePolicy) {
      applyAiUsagePolicy(globalAiUsagePolicy);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalAiUsagePolicy]);

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        height: 100%;
      `}
    >
      <div
        className={css`
          z-index: 100;
        `}
      >
        <FilterBar
          style={{
            height: '4.5rem',
            fontSize: '1.6rem',
            marginBottom: 0
          }}
        >
          <nav onClick={handleFilterClick}>Word Master</nav>
          <nav className="active">AI Cards</nav>
        </FilterBar>
      </div>
      <div
        className={css`
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        `}
      >
        {loadingAICardChat ? (
          <Loading style={{ height: '50%' }} text="Loading AI Cards" />
        ) : (
          <ActivitiesContainer displayedThemeColor={displayedThemeColor} />
        )}
      </div>

      <StatusInterface
        posting={isGeneratingAICard}
        statusMessage={aiCardStatusMessage}
      />
      {!canGenerateAICard && (
        <div
          className={css`
            text-align: center;
            width: 100%;
            color: #fff;
            background: ${Color.black()};
            font-family: monospace;
            padding: 1rem;
          `}
        >
          You do not have the license to summon AI Cards. Get it from the{' '}
          <Link
            style={{ fontWeight: 'bold', color: Color.gold() }}
            to={`/settings`}
          >
            settings
          </Link>{' '}
          page
        </div>
      )}
      <div className={aiCardControlTrayCls}>
        <GenerateCardInterface
          canGenerateAICard={!!canGenerateAICard}
          numSummoned={numCardSummonedToday}
          onGenerateAICard={handleGenerateCard}
          onRechargeEnergy={handleOpenEnergyDashboard}
          posting={isGeneratingAICard}
          loading={loadingAICardChat}
          energyDepleted={energyDepleted}
          energyLoading={aiUsagePolicyLoading && !aiUsagePolicy}
        />
      </div>
      {energyDashboardShown && (
        <AiEnergyDashboardModal
          modalLevel={3}
          onHide={() => setEnergyDashboardShown(false)}
        />
      )}
    </div>
  );

  function handleOpenEnergyDashboard() {
    setEnergyDashboardShown(true);
  }

  function handleFilterClick() {
    onSetCollectType(VOCAB_CHAT_TYPE);
    navigate(`/chat/${VOCAB_CHAT_TYPE}`);
  }

  async function loadAiUsagePolicy({
    isCancelled = () => false
  }: {
    isCancelled?: () => boolean;
  } = {}) {
    if (!userId) return null;
    if (!isCancelled()) {
      setAiUsagePolicyLoading(true);
    }
    try {
      const result = await getAiEnergyPolicy();
      const nextPolicy = result?.aiUsagePolicy || null;
      if (!isCancelled()) {
        applyAiUsagePolicy(nextPolicy);
      }
      return nextPolicy;
    } catch (error) {
      console.error(error);
      return null;
    } finally {
      if (!isCancelled()) {
        setAiUsagePolicyLoading(false);
      }
    }
  }

  function applyAiUsagePolicy(nextPolicy?: AiEnergyDisplayPolicy | null) {
    if (!nextPolicy) return;
    setAiUsagePolicy(nextPolicy);
    onUpdateTodayStats({
      newStats: {
        aiUsagePolicy: nextPolicy
      }
    });
  }

  async function handleGenerateCard() {
    try {
      const policy = aiUsagePolicy || (await loadAiUsagePolicy());
      if (
        policy &&
        typeof policy.energyRemaining === 'number' &&
        policy.energyRemaining <= 0
      ) {
        handleOpenEnergyDashboard();
        return onSetAICardStatusMessage('Recharge Energy to summon a card.');
      }
      onSetIsGeneratingAICard(true);
      onSetAICardStatusMessage('Checking Energy...');
      const {
        isMaxReached,
        coins,
        numCardSummoned,
        feed,
        card,
        isMysteryCard,
        isTotalMysteryCard,
        aiUsagePolicy: nextAiUsagePolicy
      } = await generateAICard();
      if (nextAiUsagePolicy) {
        applyAiUsagePolicy(nextAiUsagePolicy);
      }
      // The server omits this when it could not read the canonical count after
      // the card went live (a bookkeeping failure never fails a real summon).
      // Keep the current count rather than writing undefined into chat state.
      if (
        typeof numCardSummoned === 'number' &&
        Number.isSafeInteger(numCardSummoned) &&
        numCardSummoned >= 0
      ) {
        onUpdateNumSummoned(numCardSummoned);
      }
      if (isMaxReached) {
        onSetIsGeneratingAICard(false);
        return onSetAICardStatusMessage(
          `You cannot summon any more cards today.`
        );
      }
      if (typeof coins === 'number') {
        onSetUserState({ userId, newState: { twinkleCoins: coins } });
      }
      onSetAICardStatusMessage(
        isTotalMysteryCard
          ? 'Total Mystery Card Summoned'
          : isMysteryCard
            ? 'Mystery Card Summoned'
            : 'Card Summoned'
      );
      trackEvent('ai_card_summon', {
        card_quality: card?.quality,
        is_mystery_card: !!isMysteryCard,
        is_total_mystery_card: !!isTotalMysteryCard
      });
      onPostAICardFeed({
        feed,
        // Recovery rehydrates the card from the writer. If it was burned or
        // transferred after the original summon, keep the historical feed but
        // do not synthesize current collection ownership.
        isSummon:
          Number(card?.ownerId) === Number(userId) &&
          Number(card?.isBurned || 0) !== 1,
        card
      });
    } catch (error: any) {
      console.error(error);

      const errorKey = error?.error || error?.data?.error;

      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (error?.aiUsagePolicy) {
        applyAiUsagePolicy(error.aiUsagePolicy);
        errorMessage = 'Recharge Energy to summon a card.';
      } else if (errorKey === 'inappropriate_word') {
        errorMessage = 'Card setup failed. Please try again.';
      } else if (errorKey === 'image_generation_failed') {
        errorMessage =
          "Card generation failed. Open 'My Collection' at the bottom right, select your card, and press 'Generate' to add an image.";
      } else if (
        error?.code === 'MANUAL_IDENTITY_MUTATION_BUSY' ||
        error?.code === 'ai_card_summon_day_changed'
      ) {
        errorMessage =
          error?.message || errorKey || 'Please try summoning again.';
      }

      onSetAICardStatusMessage(errorMessage);
    } finally {
      onSetIsGeneratingAICard(false);
    }
  }
}
