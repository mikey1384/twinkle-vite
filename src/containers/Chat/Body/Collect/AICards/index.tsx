import React, { useEffect, useMemo, useState } from 'react';
import GenerateCardInterface from './GenerateCardInterface';
import FilterBar from '~/components/FilterBar';
import ActivitiesContainer from './ActivitiesContainer';
import Loading from '~/components/Loading';
import { Link, useNavigate } from 'react-router-dom';
import { Color } from '~/constants/css';
import { VOCAB_CHAT_TYPE } from '~/constants/defaultValues';
import {
  useAppContext,
  useChatContext,
  useKeyContext,
  useNotiContext
} from '~/contexts';
import { css } from '@emotion/css';
import StatusInterface from './StatusInterface';
import AiEnergyCard from '~/components/AiEnergyCard';
import {
  errorHasActualCommunityFundsBalance,
  isCommunityFundRechargeAvailable
} from '~/helpers/aiEnergy';

interface AiUsageRequirement {
  key: string;
  label: string;
  done: boolean;
  current?: number;
  required?: number;
}

interface AiUsagePolicy {
  dayIndex?: number;
  energyRemaining?: number;
  energyPercent?: number;
  energySegments?: number;
  energySegmentsRemaining?: number;
  currentMode?: 'full_quality' | 'low_energy';
  lastUsageOverflowed?: boolean;
  resetCost?: number;
  resetPurchasesToday?: number;
  communityFundRechargeCoinsRemaining?: number;
  communityFundResetEligibility?: {
    eligible: boolean;
    requirements: AiUsageRequirement[];
  };
}

export default function AICards({
  displayedThemeColor,
  loadingAICardChat
}: {
  displayedThemeColor: string;
  loadingAICardChat: boolean;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const canGenerateAICard = useKeyContext((v) => v.myState.canGenerateAICard);
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const communityFunds = useKeyContext((v) => v.myState.communityFunds);
  const communityFundsLoaded = useKeyContext(
    (v) => v.myState.communityFundsLoaded
  );
  const generateAICard = useAppContext((v) => v.requestHelpers.generateAICard);
  const getAiEnergyPolicy = useAppContext(
    (v) => v.requestHelpers.getAiEnergyPolicy
  );
  const purchaseAiEnergyRecharge = useAppContext(
    (v) => v.requestHelpers.purchaseAiEnergyRecharge
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
    (v) => v.state.todayStats.aiUsagePolicy as AiUsagePolicy | null
  );
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const [aiUsagePolicy, setAiUsagePolicy] = useState<AiUsagePolicy | null>(
    globalAiUsagePolicy || null
  );
  const [aiUsagePolicyLoading, setAiUsagePolicyLoading] = useState(false);
  const [aiUsageResetLoading, setAiUsageResetLoading] = useState(false);
  const [aiUsageResetError, setAiUsageResetError] = useState('');
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
      <div
        className={css`
          min-height: 9.5rem;
          max-height: 45%;
          background: ${Color.inputGray()};
          padding: 1rem;
          border-top: 1px solid var(--ui-border);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        `}
      >
        {aiUsagePolicy && (
          <AiEnergyCard
            variant="inline"
            className={css`
              flex-shrink: 0;
            `}
            energyPercent={aiUsagePolicy.energyPercent ?? 0}
            energySegments={aiUsagePolicy.energySegments}
            energySegmentsRemaining={aiUsagePolicy.energySegmentsRemaining}
            overflowed={aiUsagePolicy.lastUsageOverflowed}
            resetNeeded={energyDepleted}
            resetCost={aiUsagePolicy.resetCost || 0}
            resetPurchaseNumber={(aiUsagePolicy.resetPurchasesToday || 0) + 1}
            twinkleCoins={twinkleCoins}
            rechargeLoading={aiUsageResetLoading}
            rechargeError={aiUsageResetError}
            onRecharge={() => handlePurchaseAiUsageReset(false)}
            communityFundsEligible={isCommunityFundRechargeAvailable({
              aiUsagePolicy,
              communityFunds,
              communityFundsKnown: communityFundsLoaded
            })}
            communityFundsRequirements={
              aiUsagePolicy.communityFundResetEligibility?.requirements
            }
            onRechargeWithCommunityFunds={
              aiUsagePolicy.communityFundResetEligibility
                ? () => handlePurchaseAiUsageReset(true)
                : undefined
            }
          />
        )}
        <GenerateCardInterface
          canGenerateAICard={!!canGenerateAICard}
          numSummoned={numCardSummonedToday}
          onGenerateAICard={handleGenerateCard}
          posting={isGeneratingAICard}
          loading={loadingAICardChat}
          energyDepleted={energyDepleted}
          energyLoading={aiUsagePolicyLoading && !aiUsagePolicy}
        />
      </div>
    </div>
  );

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

  function applyAiUsagePolicy(nextPolicy?: AiUsagePolicy | null) {
    if (!nextPolicy) return;
    setAiUsagePolicy((policy) => ({
      ...nextPolicy,
      ...(policy?.communityFundResetEligibility &&
      !nextPolicy.communityFundResetEligibility &&
      (!nextPolicy.dayIndex || nextPolicy.dayIndex === policy.dayIndex)
        ? {
            communityFundResetEligibility: policy.communityFundResetEligibility
          }
        : {})
    }));
    onUpdateTodayStats({
      newStats: {
        aiUsagePolicy: nextPolicy
      }
    });
  }

  async function handlePurchaseAiUsageReset(useCommunityFunds = false) {
    if (aiUsageResetLoading) return;
    setAiUsageResetLoading(true);
    setAiUsageResetError('');
    try {
      const result = await purchaseAiEnergyRecharge({
        useCommunityFunds
      });
      if (result?.aiUsagePolicy) {
        applyAiUsagePolicy(result.aiUsagePolicy);
      }
      if (typeof result?.newBalance === 'number') {
        onSetUserState({
          userId,
          newState: { twinkleCoins: result.newBalance }
        });
      }
      if (typeof result?.communityFunds === 'number') {
        onSetUserState({
          userId,
          newState: { communityFunds: result.communityFunds }
        });
      }
    } catch (error: any) {
      console.error(error);
      if (error?.aiUsagePolicy) {
        applyAiUsagePolicy(error.aiUsagePolicy);
      }
      if (
        typeof error?.currentCommunityFunds === 'number' &&
        errorHasActualCommunityFundsBalance(error)
      ) {
        const normalizedCommunityFunds = Math.max(
          0,
          Number(error.currentCommunityFunds || 0)
        );
        onSetUserState({
          userId,
          newState: { communityFunds: normalizedCommunityFunds }
        });
      }
      setAiUsageResetError(
        error?.message || 'Unable to recharge Energy right now.'
      );
    } finally {
      setAiUsageResetLoading(false);
    }
  }

  async function handleGenerateCard() {
    try {
      const policy = aiUsagePolicy || (await loadAiUsagePolicy());
      if (
        policy &&
        typeof policy.energyRemaining === 'number' &&
        policy.energyRemaining <= 0
      ) {
        return onSetAICardStatusMessage(
          'Recharge Energy to summon a card.'
        );
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
        aiUsagePolicy: nextAiUsagePolicy
      } = await generateAICard();
      if (nextAiUsagePolicy) {
        applyAiUsagePolicy(nextAiUsagePolicy);
      }
      onUpdateNumSummoned(numCardSummoned);
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
        isMysteryCard ? 'Mystery Card Summoned' : 'Card Summoned'
      );
      onPostAICardFeed({
        feed,
        isSummon: true,
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
      }

      onSetAICardStatusMessage(errorMessage);
    } finally {
      onSetIsGeneratingAICard(false);
    }
  }
}
