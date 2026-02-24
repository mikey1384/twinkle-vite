import React, { useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import FilterBar from '~/components/FilterBar';
import NextDayCountdown from '~/components/NextDayCountdown';
import Modal from '~/components/Modal';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import { css, keyframes } from '@emotion/css';
import { Color, mobileMaxWidth, getStreakColor } from '~/constants/css';
import { priceTable } from '~/constants/defaultValues';
import {
  useAppContext,
  useChatContext,
  useHomeContext,
  useKeyContext
} from '~/contexts';
import { useRoleColor } from '~/theme/useRoleColor';
import { addCommasToNumber } from '~/helpers/stringHelpers';

const DEFAULT_XP_NUMBER_COLOR = 'rgba(97, 226, 101, 1)';
const DEFAULT_REWARD_COLOR = 'rgba(255, 203, 50, 1)';
import { socket } from '~/constants/sockets/api';
import zero from '~/assets/zero.png';
import ciel from '~/assets/ciel.png';

const gradeColors: Record<string, string> = {
  Masterpiece: '#FFD700', // Gold
  Pass: '#4CAF50', // Green
  Fail: '#f44336' // Red
};

const gradeLabels: Record<string, string> = {
  Masterpiece: 'Masterpiece',
  Pass: 'Pass',
  Fail: 'Fail'
};

const masterpieceTypeLabels: Record<string, string> = {
  heart: 'Masterpiece (Heart)',
  mind: 'Masterpiece (Mind)',
  heart_and_mind: 'Masterpiece (Heart & Mind)'
};

const gradeSymbols: Record<string, string> = {
  Masterpiece: '★',
  Pass: '✓',
  Fail: '✗'
};

const fireAnimation = keyframes`
  0%, 100% { transform: scale(1) rotate(-3deg); }
  50% { transform: scale(1.1) rotate(3deg); }
`;

const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const VIBE_OPTIONS = [
  {
    id: 'default',
    title: 'Twinkle Choice',
    description: 'Let Twinkle pick a balanced question for tomorrow.'
  },
  {
    id: 'follow_up',
    title: 'Keep Going',
    description: "Continue today's reflection with a connected next question."
  },
  {
    id: 'go_deeper',
    title: 'Go Deeper',
    description: 'Stay on the same theme and think one level deeper.'
  },
  {
    id: 'open_new_door',
    title: 'New Angle',
    description: 'Try a fresh angle that still feels about you.'
  },
  {
    id: 'light',
    title: 'Light & Easy',
    description: 'Keep tomorrow easier, lighter, and less heavy.'
  },
  {
    id: 'opinion',
    title: 'My Take',
    description: 'Ask for your opinion and why you see it that way.'
  },
  {
    id: 'autobiography',
    title: 'My Story',
    description: 'Reflect on one chapter from your life story.'
  },
  {
    id: 'connection',
    title: 'People & Connection',
    description: 'Focus on friendships, relationships, and belonging.'
  },
  {
    id: 'growth',
    title: 'Level Up',
    description: 'Focus on learning, courage, and your next direction.'
  }
] as const;

const FOCUS_OPTIONS = [
  {
    id: 'infer',
    title: 'Let Twinkle Pick',
    description: 'Let Twinkle infer your focus from your recent activity.'
  },
  {
    id: 'dating_partner_search',
    title: 'Crushes & Dating',
    description: 'Questions about crushes, dating, and partner hopes.'
  },
  {
    id: 'relationship_partnership',
    title: 'Relationship Vibes',
    description: 'Questions about your current relationship dynamics.'
  },
  {
    id: 'breakup_recovery',
    title: 'After a Breakup',
    description: 'Questions for healing and moving forward after a breakup.'
  },
  {
    id: 'family_parenting',
    title: 'Family Life',
    description: 'Questions about family roles, support, and responsibilities.'
  },
  {
    id: 'friendship_social_life',
    title: 'Friends & Social Life',
    description: 'Questions about friendships, social energy, and belonging.'
  },
  {
    id: 'job_search_career',
    title: 'School & Future Dreams',
    titleAdult: 'Career & Work Direction',
    description:
      'Questions about school path, future goals, and dream direction.',
    descriptionAdult:
      'Questions about career choices, work direction, and your next step.'
  },
  {
    id: 'exam_test_prep',
    title: 'Tests & Study',
    titleAdult: 'Exams & Certifications',
    description: 'Questions about studying, test pressure, and exam mindset.',
    descriptionAdult:
      'Questions about exam prep, certifications, and study pressure.'
  },
  {
    id: 'entrepreneurship',
    title: 'Projects & Big Ideas',
    description:
      'Questions about building projects, clubs, and idea-driven goals.',
    titleAdult: 'Projects & Entrepreneurship',
    descriptionAdult:
      'Questions about projects, side hustles, and entrepreneurship.'
  },
  {
    id: 'financial_stability',
    title: 'Money Habits & Goals',
    titleAdult: 'Financial Stability',
    description: 'Questions about saving, spending, and money confidence.',
    descriptionAdult:
      'Questions about financial stability, tradeoffs, and money pressure.'
  },
  {
    id: 'purpose_identity',
    title: 'Who Am I?',
    description: 'Questions about identity, meaning, and personal values.'
  },
  {
    id: 'confidence_self_trust',
    title: 'Confidence / Self-trust',
    description: 'Questions about trusting yourself and your decisions.'
  },
  {
    id: 'stress_burnout',
    title: 'Stress / Burnout',
    description: 'Questions about stress load, boundaries, and recovery.'
  },
  {
    id: 'grief_loss',
    title: 'Grief / Loss',
    description: 'Gentle questions for grief, loss, and emotional change.'
  },
  {
    id: 'health_energy',
    title: 'Health / Energy',
    description: 'Questions about sleep, physical wellbeing, and energy.'
  },
  {
    id: 'life_transitions',
    title: 'Life Transitions',
    description: 'Questions about big changes and adapting to new seasons.'
  },
  {
    id: 'faith_spirituality',
    title: 'Faith / Spirituality',
    description: 'Questions about beliefs, spirituality, and meaning.'
  }
] as const;

type VibeOptionId = (typeof VIBE_OPTIONS)[number]['id'];
type FocusOptionId = (typeof FOCUS_OPTIONS)[number]['id'];

export default function GradingResult({
  question,
  questionId,
  response,
  originalResponse,
  initialRefinedResponse,
  grade,
  masterpieceType,
  xpAwarded,
  feedback,
  responseId,
  streak = 1,
  streakMultiplier = 1,
  usedRepair = false,
  isShared: initialIsShared,
  sharedWithZero: initialSharedWithZero,
  sharedWithCiel: initialSharedWithCiel,
  initialNextQuestionCategory,
  initialCurrentFocus,
  isAdultUser = false,
  onClose
}: {
  question: string;
  questionId: number | null;
  response: string;
  originalResponse: string;
  initialRefinedResponse: string | null;
  grade: string;
  masterpieceType?: 'heart' | 'mind' | 'heart_and_mind' | null;
  xpAwarded: number;
  feedback: string;
  responseId: number;
  streak?: number;
  streakMultiplier?: number;
  usedRepair?: boolean;
  isShared: boolean;
  sharedWithZero: boolean;
  sharedWithCiel: boolean;
  initialNextQuestionCategory?: string | null;
  initialCurrentFocus?: string | null;
  isAdultUser?: boolean;
  onClose: () => void;
}) {
  const shareDailyQuestionResponse = useAppContext(
    (v) => v.requestHelpers.shareDailyQuestionResponse
  );
  const shareDailyQuestionWithAI = useAppContext(
    (v) => v.requestHelpers.shareDailyQuestionWithAI
  );
  const refineDailyQuestionResponse = useAppContext(
    (v) => v.requestHelpers.refineDailyQuestionResponse
  );
  const setDailyQuestionNextCategory = useAppContext(
    (v) => v.requestHelpers.setDailyQuestionNextCategory
  );
  const setDailyQuestionCurrentFocus = useAppContext(
    (v) => v.requestHelpers.setDailyQuestionCurrentFocus
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onLoadNewFeeds = useHomeContext((v) => v.actions.onLoadNewFeeds);
  const { userId, twinkleCoins } = useKeyContext((v) => v.myState);
  const thinkHardState = useChatContext((v) => v.state.thinkHard);
  const { colorKey: doneColor } = useRoleColor('done', { fallback: 'blue' });
  const xpNumberRole = useRoleColor('xpNumber', { fallback: 'logoGreen' });
  const xpNumberColor = xpNumberRole.getColor() || DEFAULT_XP_NUMBER_COLOR;
  const rewardColor = DEFAULT_REWARD_COLOR;

  const [sharing, setSharing] = useState(false);
  const [isShared, setIsShared] = useState(initialIsShared);
  const [sharedWithZero, setSharedWithZero] = useState(initialSharedWithZero);
  const [sharedWithCiel, setSharedWithCiel] = useState(initialSharedWithCiel);
  const [sharingWithZero, setSharingWithZero] = useState(false);
  const [sharingWithCiel, setSharingWithCiel] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [preparingAIVersionTarget, setPreparingAIVersionTarget] = useState<
    'zero' | 'ciel' | null
  >(null);
  const [refinedResponse, setRefinedResponse] = useState<string | null>(
    initialRefinedResponse || null
  );
  const [refining, setRefining] = useState(false);
  const [showVersionSelector, setShowVersionSelector] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<
    'original' | 'refined'
  >('refined');
  const [showAIVersionSelector, setShowAIVersionSelector] = useState(false);
  const [aiShareTarget, setAiShareTarget] = useState<'zero' | 'ciel' | null>(
    null
  );
  const [aiSelectedVersion, setAiSelectedVersion] = useState<
    'original' | 'refined' | 'both'
  >('refined');
  const [nextCategory, setNextCategory] = useState<string | null>(
    initialNextQuestionCategory || null
  );
  const [currentFocus, setCurrentFocus] = useState<string | null>(
    initialCurrentFocus || null
  );
  const [isVibeModalOpen, setIsVibeModalOpen] = useState(false);
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [isSettingVibe, setIsSettingVibe] = useState(false);
  const [isSettingFocus, setIsSettingFocus] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{
    type: 'vibe' | 'focus';
    selection: string;
    price: number;
  } | null>(null);

  async function handleRefine() {
    if (refinedResponse || refining) return;

    try {
      setRefining(true);
      setShareError(null);

      const result = await refineDailyQuestionResponse({ responseId });

      if (result.error) {
        setShareError(result.error);
        return;
      }

      setRefinedResponse(result.refinedText);
    } catch (err) {
      console.error('Failed to refine:', err);
      setShareError('Failed to refine response. Please try again.');
    } finally {
      setRefining(false);
    }
  }

  async function handleShareClick() {
    // If we haven't refined yet, fetch refinement first
    if (!refinedResponse && !refining) {
      try {
        setRefining(true);
        setShareError(null);

        const result = await refineDailyQuestionResponse({ responseId });

        if (result.error) {
          setShareError(result.error);
          setRefining(false);
          return;
        }

        setRefinedResponse(result.refinedText);
        setRefining(false);
        setShowVersionSelector(true);
      } catch (err) {
        console.error('Failed to refine:', err);
        setShareError('Failed to prepare share options. Please try again.');
        setRefining(false);
      }
      return;
    }

    // If already refined, show version selector
    setShowVersionSelector(true);
  }

  async function handleConfirmShare() {
    try {
      setSharing(true);
      setShareError(null);

      const rawResponseText = originalResponse || response;
      const textToShare =
        selectedVersion === 'refined' && refinedResponse
          ? refinedResponse
          : rawResponseText;

      const result = await shareDailyQuestionResponse({
        responseId,
        responseText: textToShare
      });

      if (result.error) {
        setShareError(result.error);
        return;
      }

      // Add to home feed for real-time update
      if (result.feed) {
        onLoadNewFeeds([result.feed]);
      }

      // Update user's coin balance in real-time
      if (result.newCoins !== undefined && userId) {
        onSetUserState({ userId, newState: { twinkleCoins: result.newCoins } });
      }

      setIsShared(true);
      setShowVersionSelector(false);
    } catch (err) {
      console.error('Failed to share:', err);
      setShareError('Failed to share. Please try again.');
    } finally {
      setSharing(false);
    }
  }

  function getVibeLabel(category: string | null) {
    const normalized = category || 'default';
    const option = VIBE_OPTIONS.find((entry) => entry.id === normalized);
    return option ? option.title : 'Default';
  }

  function getFocusLabel(focus: string | null) {
    const normalized = focus || 'infer';
    const option = FOCUS_OPTIONS.find((entry) => entry.id === normalized);
    return option ? getFocusOptionTitle(option) : 'Let Twinkle Pick';
  }

  function getFocusOptionTitle(
    option: (typeof FOCUS_OPTIONS)[number]
  ): string {
    return isAdultUser && 'titleAdult' in option && option.titleAdult
      ? option.titleAdult
      : option.title;
  }

  function getFocusOptionDescription(
    option: (typeof FOCUS_OPTIONS)[number]
  ): string {
    return isAdultUser &&
      'descriptionAdult' in option &&
      option.descriptionAdult
      ? option.descriptionAdult
      : option.description;
  }

  function handleOpenVibeModal() {
    if (!canChooseTomorrowPreferences) return;
    setShareError(null);
    setIsVibeModalOpen(true);
  }

  function handleOpenFocusModal() {
    if (!canChooseTomorrowPreferences) return;
    setShareError(null);
    setIsFocusModalOpen(true);
  }

  function handleSelectVibe(selection: VibeOptionId) {
    if (selection === (nextCategory || 'default')) {
      setIsVibeModalOpen(false);
      return;
    }
    if (selection === 'default') {
      void applyVibeSelection(selection);
      return;
    }
    setIsVibeModalOpen(false);
    setPendingPayment({
      type: 'vibe',
      selection,
      price: tomorrowVibePrice
    });
  }

  function handleSelectFocus(selection: FocusOptionId) {
    if (selection === (currentFocus || 'infer')) {
      setIsFocusModalOpen(false);
      return;
    }
    if (selection === 'infer') {
      void applyFocusSelection(selection);
      return;
    }
    setIsFocusModalOpen(false);
    setPendingPayment({
      type: 'focus',
      selection,
      price: currentFocusPrice
    });
  }

  async function applyVibeSelection(selection: VibeOptionId) {
    try {
      setIsSettingVibe(true);
      setShareError(null);
      const content = selection === 'follow_up' ? feedback : undefined;
      const result = await setDailyQuestionNextCategory({
        category: selection,
        content
      });
      if (result.error) {
        setShareError(result.error);
        return;
      }
      setNextCategory(result.nextQuestionCategory || null);
      if (result.newCoins !== undefined && userId) {
        onSetUserState({ userId, newState: { twinkleCoins: result.newCoins } });
      }
      setIsVibeModalOpen(false);
    } catch (err) {
      console.error('Failed to set tomorrow vibe:', err);
      setShareError('Failed to set tomorrow vibe. Please try again.');
    } finally {
      setIsSettingVibe(false);
      setPendingPayment(null);
    }
  }

  async function applyFocusSelection(selection: FocusOptionId) {
    try {
      setIsSettingFocus(true);
      setShareError(null);
      const result = await setDailyQuestionCurrentFocus({
        currentFocus: selection
      });
      if (result.error) {
        setShareError(result.error);
        return;
      }
      setCurrentFocus(result.currentFocus || null);
      if (result.newCoins !== undefined && userId) {
        onSetUserState({ userId, newState: { twinkleCoins: result.newCoins } });
      }
      setIsFocusModalOpen(false);
    } catch (err) {
      console.error('Failed to set current focus:', err);
      setShareError('Failed to set current focus. Please try again.');
    } finally {
      setIsSettingFocus(false);
      setPendingPayment(null);
    }
  }

  async function handleConfirmPendingPayment() {
    if (!pendingPayment) return;
    if (pendingPayment.type === 'vibe') {
      await applyVibeSelection(pendingPayment.selection as VibeOptionId);
      return;
    }
    await applyFocusSelection(pendingPayment.selection as FocusOptionId);
  }

  const gradeColor = gradeColors[grade] || Color.darkerGray();
  const gradeLabel =
    grade === 'Masterpiece' && masterpieceType
      ? masterpieceTypeLabels[masterpieceType] || 'Masterpiece'
      : gradeLabels[grade] || '';
  const gradeSymbol = gradeSymbols[grade] || '?';
  const canShareToFeed = grade !== 'Fail';
  const canShareToFeedNow = canShareToFeed && !isShared;
  const hasResponseText = !!(originalResponse || response);
  const canShareToAI = hasResponseText;
  const canShareWithZero = canShareToAI && !sharedWithZero;
  const canShareWithCiel = canShareToAI && !sharedWithCiel;
  const canChooseTomorrowPreferences = grade !== 'Fail';
  const tomorrowVibePrice = priceTable.dailyQuestionTomorrowVibe;
  const currentFocusPrice = priceTable.dailyQuestionCurrentFocus;
  const pendingPaymentLabel = pendingPayment
    ? pendingPayment.type === 'vibe'
      ? getVibeLabel(pendingPayment.selection)
      : getFocusLabel(pendingPayment.selection)
    : '';

  // Coin rewards: 1,000 for Pass, 10,000 for Masterpiece (Fail gets nothing)
  const shareCoinsReward = grade === 'Masterpiece' ? 10000 : 1000;
  // AI share reward is only available if passed AND not already shared with either bot
  const alreadySharedWithAnyAI = sharedWithZero || sharedWithCiel;
  const canGetAIShareCoins = grade !== 'Fail' && !alreadySharedWithAnyAI;

  return (
    <div
      className={css`
        padding: 1.5rem;
      `}
    >
      {/* Grade Display */}
      <div
        className={css`
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 2rem;
        `}
      >
        <div
          className={css`
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: ${gradeColor};
            display: flex;
            align-items: center;
            justify-content: center;
            animation: ${pulseAnimation} 2s ease-in-out infinite;
            box-shadow: 0 4px 20px ${gradeColor}40;
          `}
        >
          <span
            className={css`
              font-size: 3rem;
              font-weight: bold;
              color: white;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            `}
          >
            {gradeSymbol}
          </span>
        </div>
        <p
          className={css`
            font-size: 1.5rem;
            color: ${gradeColor};
            margin-top: 0.5rem;
            font-weight: 600;
          `}
        >
          {gradeLabel}
        </p>
      </div>

      {/* XP Awarded */}
      {xpAwarded > 0 && (
        <div
          className={css`
            text-align: center;
            margin-bottom: 1.5rem;
            font-size: 1.5rem;
            font-weight: bold;
          `}
        >
          <span style={{ color: xpNumberColor }}>
            +{addCommasToNumber(xpAwarded)}
          </span>{' '}
          <span style={{ color: rewardColor }}>XP</span>
        </div>
      )}

      {/* Streak Display */}
      {streak > 0 && grade !== 'Fail' && (
        <div
          className={css`
            text-align: center;
            margin-bottom: 1.5rem;
            padding: 1rem 1.5rem;
            background: ${getStreakColor(streak)}15;
            border-radius: 12px;
          `}
        >
          <div
            className={css`
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 0.5rem;
            `}
          >
            <span
              className={css`
                font-size: ${streak >= 10
                  ? '2.5rem'
                  : streak >= 5
                  ? '2.2rem'
                  : '2rem'};
                animation: ${streak >= 5 ? fireAnimation : 'none'} 0.6s
                  ease-in-out infinite;
              `}
            >
              🔥
            </span>
            <span
              className={css`
                font-size: ${streak >= 10
                  ? '2rem'
                  : streak >= 5
                  ? '1.8rem'
                  : '1.6rem'};
                font-weight: bold;
                color: ${getStreakColor(streak)};
              `}
            >
              {streak}-day streak
            </span>
          </div>
          {streakMultiplier > 1 && (
            <p
              className={css`
                font-size: 1.3rem;
                color: ${getStreakColor(streak)};
                margin-top: 0.5rem;
                font-weight: 600;
              `}
            >
              {streakMultiplier >= 10
                ? 'x10 MAX!'
                : `x${streakMultiplier} XP multiplier!`}
            </p>
          )}
          {usedRepair && (
            <p
              className={css`
                font-size: 1.2rem;
                color: ${Color.green()};
                margin-top: 0.5rem;
                font-weight: 600;
              `}
            >
              ✨ Streak saved with repair!
            </p>
          )}
        </div>
      )}

      {/* Feedback */}
      <div
        className={css`
          background: ${Color.highlightGray()};
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        `}
      >
        <h4
          className={css`
            font-size: 1.3rem;
            color: ${Color.darkerGray()};
            margin-bottom: 0.5rem;
          `}
        >
          Feedback
        </h4>
        <p
          className={css`
            font-size: 1.4rem;
            color: ${Color.black()};
            line-height: 1.6;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.3rem;
            }
          `}
        >
          {feedback}
        </p>
      </div>

      {/* Version Selector - shown after clicking Share */}
      {showVersionSelector && refinedResponse && (
        <div
          className={css`
            margin-bottom: 1.5rem;
          `}
        >
          <h4
            className={css`
              font-size: 1.3rem;
              color: ${Color.darkerGray()};
              margin-bottom: 0.75rem;
            `}
          >
            Choose version to share:
          </h4>
          <FilterBar
            style={{
              fontSize: '1.3rem',
              height: '3.8rem'
            }}
          >
            <nav
              className={selectedVersion === 'original' ? 'active' : ''}
              onClick={() => setSelectedVersion('original')}
            >
              <Icon icon="pencil-alt" style={{ marginRight: '0.5rem' }} />
              My Original
            </nav>
            <nav
              className={selectedVersion === 'refined' ? 'active' : ''}
              onClick={() => setSelectedVersion('refined')}
            >
              <Icon icon="magic" style={{ marginRight: '0.5rem' }} />
              AI Polished
            </nav>
          </FilterBar>

          {/* Preview of selected version */}
          <div
            className={css`
              padding: 1rem;
              background: ${Color.wellGray()};
              border-radius: 8px;
              max-height: 200px;
              overflow-y: auto;
            `}
          >
            <p
              className={css`
                font-size: 1.2rem;
                color: ${Color.darkerGray()};
                margin-bottom: 0.5rem;
                font-style: italic;
              `}
            >
              Q: {question}
            </p>
            <p
              className={css`
                font-size: 1.3rem;
                color: ${Color.black()};
                line-height: 1.6;
                white-space: pre-wrap;
              `}
            >
              {selectedVersion === 'refined'
                ? refinedResponse
                : originalResponse || response}
            </p>
          </div>
        </div>
      )}

      {showAIVersionSelector && aiShareTarget && (
        <div
          className={css`
            margin-bottom: 1.5rem;
          `}
        >
          <h4
            className={css`
              font-size: 1.3rem;
              color: ${Color.darkerGray()};
              margin-bottom: 0.75rem;
            `}
          >
            Choose version to share with{' '}
            {aiShareTarget === 'ciel' ? 'Ciel' : 'Zero'}:
          </h4>
          <FilterBar
            style={{
              fontSize: '1.3rem',
              height: '3.8rem'
            }}
          >
            <nav
              className={aiSelectedVersion === 'original' ? 'active' : ''}
              onClick={() => setAiSelectedVersion('original')}
              style={{ minWidth: '9rem' }}
            >
              <Icon icon="pencil-alt" style={{ marginRight: '0.5rem' }} />
              Original (raw)
            </nav>
            <nav
              className={aiSelectedVersion === 'refined' ? 'active' : ''}
              onClick={() => setAiSelectedVersion('refined')}
              style={{ minWidth: '9rem' }}
            >
              <Icon icon="magic" style={{ marginRight: '0.5rem' }} />
              AI‑polished
            </nav>
            <nav
              className={aiSelectedVersion === 'both' ? 'active' : ''}
              onClick={() => setAiSelectedVersion('both')}
              style={{ minWidth: '9rem' }}
            >
              <Icon icon="copy" style={{ marginRight: '0.5rem' }} />
              Both
            </nav>
          </FilterBar>

          <div
            className={css`
              padding: 1rem;
              background: ${Color.wellGray()};
              border-radius: 8px;
              max-height: 220px;
              overflow-y: auto;
            `}
          >
            <p
              className={css`
                font-size: 1.2rem;
                color: ${Color.darkerGray()};
                margin-bottom: 0.5rem;
                font-style: italic;
              `}
            >
              Q: {question}
            </p>
            {aiSelectedVersion === 'both' ? (
              <>
                <p
                  className={css`
                    font-size: 1.15rem;
                    color: ${Color.darkerGray()};
                    margin-bottom: 0.3rem;
                    font-weight: 600;
                  `}
                >
                  Original (raw)
                </p>
                <p
                  className={css`
                    font-size: 1.3rem;
                    color: ${Color.black()};
                    line-height: 1.6;
                    white-space: pre-wrap;
                    margin-bottom: 1rem;
                  `}
                >
                  {originalResponse || response}
                </p>
                <p
                  className={css`
                    font-size: 1.15rem;
                    color: ${Color.logoBlue()};
                    margin-bottom: 0.3rem;
                    font-weight: 600;
                  `}
                >
                  AI‑polished
                </p>
                <p
                  className={css`
                    font-size: 1.3rem;
                    color: ${Color.black()};
                    line-height: 1.6;
                    white-space: pre-wrap;
                  `}
                >
                  {refinedResponse || '(not available)'}
                </p>
              </>
            ) : (
              <p
                className={css`
                  font-size: 1.3rem;
                  color: ${Color.black()};
                  line-height: 1.6;
                  white-space: pre-wrap;
                `}
              >
                {aiSelectedVersion === 'refined'
                  ? refinedResponse || originalResponse || response
                  : originalResponse || response}
              </p>
            )}
          </div>
        </div>
      )}

      {/* View Response - shown when not in version selector mode */}
      {!showVersionSelector && (
        <details
          className={css`
            margin-bottom: 1.5rem;
          `}
        >
          <summary
            className={css`
              cursor: pointer;
              font-size: 1.3rem;
              color: ${Color.darkerGray()};
              padding: 0.5rem 0;
              &:hover {
                color: ${Color.black()};
              }
            `}
          >
            View your response
          </summary>
          <div
            className={css`
              margin-top: 1rem;
              padding: 1rem;
              background: ${Color.wellGray()};
              border-radius: 8px;
            `}
          >
            <p
              className={css`
                font-size: 1.2rem;
                color: ${Color.darkerGray()};
                margin-bottom: 0.5rem;
                font-style: italic;
              `}
            >
              Q: {question}
            </p>
            <p
              className={css`
                font-size: 1.3rem;
                color: ${Color.black()};
                line-height: 1.6;
                white-space: pre-wrap;
              `}
            >
              {response}
            </p>

            {/* Refine button inside the details */}
            {canShareToFeed && !refinedResponse && (
              <div
                className={css`
                  margin-top: 1rem;
                `}
              >
                <Button
                  variant="soft"
                  color="logoBlue"
                  onClick={handleRefine}
                  disabled={refining}
                  loading={refining && !preparingAIVersionTarget}
                >
                  <Icon icon="magic" style={{ marginRight: '0.5rem' }} />
                  {refining && !preparingAIVersionTarget
                    ? 'Polishing...'
                    : 'See AI-polished version'}
                </Button>
              </div>
            )}

            {refinedResponse && (
              <div
                className={css`
                  margin-top: 1rem;
                  padding-top: 1rem;
                  border-top: 1px solid ${Color.borderGray()};
                `}
              >
                <h5
                  className={css`
                    font-size: 1.2rem;
                    color: ${Color.logoBlue()};
                    margin-bottom: 0.5rem;
                  `}
                >
                  <Icon icon="magic" style={{ marginRight: '0.5rem' }} />
                  AI-Polished Version:
                </h5>
                <p
                  className={css`
                    font-size: 1.3rem;
                    color: ${Color.black()};
                    line-height: 1.6;
                    white-space: pre-wrap;
                  `}
                >
                  {refinedResponse}
                </p>
              </div>
            )}
          </div>
        </details>
      )}

      {/* Share Error */}
      {shareError && (
        <p
          className={css`
            color: ${Color.rose()};
            font-size: 1.2rem;
            text-align: center;
            margin-bottom: 1rem;
          `}
        >
          {shareError}
        </p>
      )}

      {/* Share hint text */}
      {!showVersionSelector &&
        !showAIVersionSelector &&
        (canShareToFeedNow || canShareWithZero || canShareWithCiel) && (
          <p
            className={css`
              text-align: center;
              font-size: 1.2rem;
              color: ${Color.darkerGray()};
              margin-bottom: 0.5rem;
            `}
          >
            You can choose to share your original response or an AI-polished
            version
          </p>
        )}

      {/* Actions */}
      <div
        className={css`
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
          padding-top: 1.5rem;
        `}
      >
        {canShareToFeed && !showVersionSelector && !showAIVersionSelector && (
          <div
            className={css`
              display: flex;
              flex-direction: column;
              align-items: center;
            `}
          >
            <Button
              variant="solid"
              color="logoBlue"
              onClick={handleShareClick}
              disabled={!canShareToFeedNow || refining}
              loading={
                canShareToFeedNow && refining && !preparingAIVersionTarget
              }
            >
              {!canShareToFeedNow ? (
                <>
                  <Icon icon="check" style={{ marginRight: '0.5rem' }} />
                  Shared to Feed
                </>
              ) : refining && !preparingAIVersionTarget ? (
                'Polishing...'
              ) : refinedResponse ? (
                <>
                  <Icon icon="share" style={{ marginRight: '0.5rem' }} />
                  Share to Feed
                </>
              ) : (
                <>
                  <Icon icon="magic" style={{ marginRight: '0.5rem' }} />
                  See AI Polished Version
                </>
              )}
            </Button>
            {canShareToFeedNow && refinedResponse && (
              <span
                className={css`
                  margin-top: 0.4rem;
                  font-size: 1.1rem;
                  color: ${Color.orange()};
                  font-weight: 600;
                `}
              >
                +{shareCoinsReward.toLocaleString()} coins
              </span>
            )}
          </div>
        )}
        {!showVersionSelector && !showAIVersionSelector && canShareToAI && (
          <>
            <div
              className={css`
                display: flex;
                flex-direction: column;
                align-items: center;
              `}
            >
              <Button
                color="logoBlue"
                variant="solid"
                tone="raised"
                onClick={() => handleShareWithAI('zero')}
                disabled={
                  !canShareWithZero ||
                  sharingWithCiel ||
                  sharingWithZero ||
                  preparingAIVersionTarget !== null
                }
                loading={
                  sharingWithZero ||
                  (preparingAIVersionTarget === 'zero' &&
                    refining &&
                    !refinedResponse)
                }
              >
                <img
                  src={zero}
                  alt="Zero"
                  className={css`
                    width: 2rem;
                    height: 2rem;
                    border-radius: 50%;
                    margin-right: 0.5rem;
                    object-fit: contain;
                    background: #fff;
                  `}
                />
                {!canShareWithZero ? (
                  <>
                    <Icon icon="check" style={{ marginRight: '0.5rem' }} />
                    Shared with Zero
                  </>
                ) : sharingWithZero ? (
                  'Sharing with Zero...'
                ) : (
                  'Share with Zero'
                )}
              </Button>
              {canShareWithZero && canGetAIShareCoins && (
                <span
                  className={css`
                    margin-top: 0.4rem;
                    font-size: 1.1rem;
                    color: ${Color.orange()};
                    font-weight: 600;
                  `}
                >
                  +{shareCoinsReward.toLocaleString()} coins
                </span>
              )}
            </div>
            <div
              className={css`
                display: flex;
                flex-direction: column;
                align-items: center;
              `}
            >
              <Button
                color="purple"
                variant="solid"
                tone="raised"
                onClick={() => handleShareWithAI('ciel')}
                disabled={
                  !canShareWithCiel ||
                  sharingWithCiel ||
                  sharingWithZero ||
                  preparingAIVersionTarget !== null
                }
                loading={
                  sharingWithCiel ||
                  (preparingAIVersionTarget === 'ciel' &&
                    refining &&
                    !refinedResponse)
                }
              >
                <img
                  src={ciel}
                  alt="Ciel"
                  className={css`
                    width: 2rem;
                    height: 2rem;
                    border-radius: 50%;
                    margin-right: 0.5rem;
                    object-fit: contain;
                    background: #fff;
                  `}
                />
                {!canShareWithCiel ? (
                  <>
                    <Icon icon="check" style={{ marginRight: '0.5rem' }} />
                    Shared with Ciel
                  </>
                ) : sharingWithCiel ? (
                  'Sharing with Ciel...'
                ) : (
                  'Share with Ciel'
                )}
              </Button>
              {canShareWithCiel && canGetAIShareCoins && (
                <span
                  className={css`
                    margin-top: 0.4rem;
                    font-size: 1.1rem;
                    color: ${Color.orange()};
                    font-weight: 600;
                  `}
                >
                  +{shareCoinsReward.toLocaleString()} coins
                </span>
              )}
            </div>
          </>
        )}
        {showVersionSelector && (
          <>
            <Button
              style={{ marginRight: '2rem' }}
              variant="ghost"
              onClick={() => setShowVersionSelector(false)}
            >
              Go Back
            </Button>
            <div
              className={css`
                display: flex;
                flex-direction: column;
                align-items: center;
              `}
            >
              <Button
                variant="solid"
                color="logoBlue"
                onClick={handleConfirmShare}
                disabled={sharing}
                loading={sharing}
              >
                <Icon icon="share" style={{ marginRight: '0.5rem' }} />
                {sharing ? 'Sharing...' : 'Share to Feed'}
              </Button>
              <span
                className={css`
                  margin-top: 0.4rem;
                  font-size: 1.1rem;
                  color: ${Color.orange()};
                  font-weight: 600;
                `}
              >
                +{shareCoinsReward.toLocaleString()} coins
              </span>
            </div>
          </>
        )}
        {showAIVersionSelector && aiShareTarget && (
          <>
            <Button variant="ghost" onClick={handleCancelAIVersionSelector}>
              Go Back
            </Button>
            <Button
              variant="solid"
              color={aiShareTarget === 'ciel' ? 'purple' : 'logoBlue'}
              onClick={handleConfirmShareWithAI}
              disabled={sharingWithZero || sharingWithCiel}
              loading={
                aiShareTarget === 'zero' ? sharingWithZero : sharingWithCiel
              }
            >
              <Icon icon="share" style={{ marginRight: '0.5rem' }} />
              {aiShareTarget === 'zero'
                ? sharingWithZero
                  ? 'Sharing with Zero...'
                  : 'Confirm Share with Zero'
                : sharingWithCiel
                ? 'Sharing with Ciel...'
                : 'Confirm Share with Ciel'}
            </Button>
          </>
        )}
      </div>

      {canChooseTomorrowPreferences &&
        !showVersionSelector &&
        !showAIVersionSelector && (
          <div
            className={css`
              margin-top: 1.6rem;
              display: flex;
              flex-direction: column;
              gap: 1rem;
            `}
          >
            <button
              type="button"
              className={css`
                width: 100%;
                text-align: left;
                border: 1px solid ${Color.borderGray()};
                border-radius: 12px;
                background: ${Color.white()};
                padding: 1.2rem 1.3rem;
                cursor: pointer;
                &:hover {
                  border-color: ${Color.logoBlue(0.5)};
                }
              `}
              onClick={handleOpenVibeModal}
            >
              <div
                className={css`
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-bottom: 0.45rem;
                  gap: 1rem;
                `}
              >
                <div
                  className={css`
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    font-size: 1.3rem;
                    color: ${Color.black()};
                    font-weight: 700;
                  `}
                >
                  <Icon icon="sparkles" />
                  Tomorrow's Vibe
                </div>
                <div
                  className={css`
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                    color: ${Color.orange()};
                    font-size: 1.15rem;
                    font-weight: 700;
                    flex-shrink: 0;
                  `}
                >
                  <Icon icon="coins" />
                  {tomorrowVibePrice.toLocaleString()}
                </div>
              </div>
              <p
                className={css`
                  margin: 0 0 0.7rem;
                  font-size: 1.15rem;
                  color: ${Color.darkerGray()};
                `}
              >
                Pick the style of tomorrow's reflection question.
              </p>
              <div
                className={css`
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  gap: 0.8rem;
                  font-size: 1.15rem;
                `}
              >
                <span
                  className={css`
                    color: ${Color.darkGray()};
                  `}
                >
                  Current selection
                </span>
                <span
                  className={css`
                    color: ${Color.black()};
                    font-weight: 700;
                  `}
                >
                  {getVibeLabel(nextCategory)}
                </span>
              </div>
            </button>

            <button
              type="button"
              className={css`
                width: 100%;
                text-align: left;
                border: 1px solid ${Color.borderGray()};
                border-radius: 12px;
                background: ${Color.white()};
                padding: 1.2rem 1.3rem;
                cursor: pointer;
                &:hover {
                  border-color: ${Color.purple(0.5)};
                }
              `}
              onClick={handleOpenFocusModal}
            >
              <div
                className={css`
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-bottom: 0.45rem;
                  gap: 1rem;
                `}
              >
                <div
                  className={css`
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    font-size: 1.3rem;
                    color: ${Color.black()};
                    font-weight: 700;
                  `}
                >
                  <Icon icon="magic" />
                  Current Focus
                </div>
                <div
                  className={css`
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                    color: ${Color.orange()};
                    font-size: 1.15rem;
                    font-weight: 700;
                    flex-shrink: 0;
                  `}
                >
                  <Icon icon="coins" />
                  {currentFocusPrice.toLocaleString()}
                </div>
              </div>
              <p
                className={css`
                  margin: 0 0 0.7rem;
                  font-size: 1.15rem;
                  color: ${Color.darkerGray()};
                `}
              >
                Pick the main life area to focus on tomorrow.
              </p>
              <div
                className={css`
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  gap: 0.8rem;
                  font-size: 1.15rem;
                `}
              >
                <span
                  className={css`
                    color: ${Color.darkGray()};
                  `}
                >
                  Current selection
                </span>
                <span
                  className={css`
                    color: ${Color.black()};
                    font-weight: 700;
                  `}
                >
                  {getFocusLabel(currentFocus)}
                </span>
              </div>
            </button>
          </div>
        )}

      <NextDayCountdown
        label="Next Daily Reflection"
        className={css`
          margin-top: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          color: ${Color.darkerGray()};
          font-size: 1.3rem;
        `}
        labelClassName={css`
          font-weight: 700;
          margin-bottom: 0.3rem;
          color: ${Color.black()};
        `}
        timerClassName={css`
          font-size: 1.4rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: ${Color.logoBlue()};
        `}
      />

      {/* Done button - below countdown */}
      {!showVersionSelector && !showAIVersionSelector && (
        <div
          className={css`
            display: flex;
            justify-content: center;
            margin-top: 1.5rem;
          `}
        >
          <Button variant="solid" color={doneColor} onClick={onClose}>
            Done
          </Button>
        </div>
      )}

      <Modal
        modalKey="DailyQuestionVibeModal"
        isOpen={isVibeModalOpen}
        onClose={() => !isSettingVibe && setIsVibeModalOpen(false)}
        hasHeader
        title="Tomorrow's Vibe"
        size="md"
      >
        <div
          className={css`
            max-height: 55vh;
            overflow-y: auto;
            border: 1px solid ${Color.borderGray()};
            border-radius: 10px;
          `}
        >
          {VIBE_OPTIONS.map((option) => {
            const isSelected = (nextCategory || 'default') === option.id;
            const isPaidOption = option.id !== 'default';
            return (
              <button
                key={option.id}
                type="button"
                className={css`
                  width: 100%;
                  text-align: left;
                  background: ${isSelected ? Color.logoBlue(0.07) : 'white'};
                  border: none;
                  border-bottom: 1px solid ${Color.borderGray()};
                  padding: 1rem 1rem;
                  cursor: pointer;
                  &:hover {
                    background: ${Color.wellGray()};
                  }
                `}
                onClick={() => handleSelectVibe(option.id)}
                disabled={isSettingVibe}
              >
                <div
                  className={css`
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 0.75rem;
                  `}
                >
                  <div>
                    <div
                      className={css`
                        font-size: 1.25rem;
                        color: ${Color.black()};
                        font-weight: 700;
                        margin-bottom: 0.3rem;
                      `}
                    >
                      {option.title}
                    </div>
                    <div
                      className={css`
                        font-size: 1.1rem;
                        color: ${Color.darkerGray()};
                      `}
                    >
                      {option.description}
                    </div>
                  </div>
                  <div
                    className={css`
                      display: flex;
                      align-items: center;
                      gap: 0.5rem;
                      flex-shrink: 0;
                    `}
                  >
                    {isPaidOption && (
                      <span
                        className={css`
                          display: inline-flex;
                          align-items: center;
                          gap: 0.3rem;
                          font-size: 1.05rem;
                          color: ${Color.orange()};
                          font-weight: 700;
                        `}
                      >
                        <Icon icon="coins" />
                        {tomorrowVibePrice.toLocaleString()}
                      </span>
                    )}
                    {isSelected && <Icon icon="check" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Modal>

      <Modal
        modalKey="DailyQuestionFocusModal"
        isOpen={isFocusModalOpen}
        onClose={() => !isSettingFocus && setIsFocusModalOpen(false)}
        hasHeader
        title="Current Focus"
        size="md"
      >
        <div
          className={css`
            max-height: 55vh;
            overflow-y: auto;
            border: 1px solid ${Color.borderGray()};
            border-radius: 10px;
          `}
        >
          {FOCUS_OPTIONS.map((option) => {
            const isSelected = (currentFocus || 'infer') === option.id;
            const isPaidOption = option.id !== 'infer';
            return (
              <button
                key={option.id}
                type="button"
                className={css`
                  width: 100%;
                  text-align: left;
                  background: ${isSelected ? Color.logoBlue(0.07) : 'white'};
                  border: none;
                  border-bottom: 1px solid ${Color.borderGray()};
                  padding: 1rem 1rem;
                  cursor: pointer;
                  &:hover {
                    background: ${Color.wellGray()};
                  }
                `}
                onClick={() => handleSelectFocus(option.id)}
                disabled={isSettingFocus}
              >
                <div
                  className={css`
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 0.75rem;
                  `}
                >
                  <div>
                    <div
                      className={css`
                        font-size: 1.25rem;
                        color: ${Color.black()};
                        font-weight: 700;
                        margin-bottom: 0.3rem;
                      `}
                    >
                      {getFocusOptionTitle(option)}
                    </div>
                    <div
                      className={css`
                        font-size: 1.1rem;
                        color: ${Color.darkerGray()};
                      `}
                    >
                      {getFocusOptionDescription(option)}
                    </div>
                  </div>
                  <div
                    className={css`
                      display: flex;
                      align-items: center;
                      gap: 0.5rem;
                      flex-shrink: 0;
                    `}
                  >
                    {isPaidOption && (
                      <span
                        className={css`
                          display: inline-flex;
                          align-items: center;
                          gap: 0.3rem;
                          font-size: 1.05rem;
                          color: ${Color.orange()};
                          font-weight: 700;
                        `}
                      >
                        <Icon icon="coins" />
                        {currentFocusPrice.toLocaleString()}
                      </span>
                    )}
                    {isSelected && <Icon icon="check" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Modal>

      {pendingPayment && (
        <ConfirmModal
          title="Confirm coin payment"
          onHide={() => setPendingPayment(null)}
          onConfirm={handleConfirmPendingPayment}
          confirmButtonColor="orange"
          confirmButtonLabel="Confirm and Continue"
          description={
            <div
              className={css`
                font-size: 1.3rem;
                line-height: 1.65;
                text-align: left;
                color: ${Color.black()};
              `}
            >
              <p style={{ marginTop: 0 }}>
                This will set <strong>{pendingPaymentLabel}</strong> and
                costs <strong>{pendingPayment.price.toLocaleString()} coins</strong>.
              </p>
              <p>
                If you already paid for this exact option today, you will{' '}
                <strong>not</strong> be charged again.
              </p>
              <p style={{ marginBottom: 0 }}>
                Your current balance: {(twinkleCoins || 0).toLocaleString()}{' '}
                coins
              </p>
            </div>
          }
        />
      )}
    </div>
  );

  async function handleShareWithAI(target: 'zero' | 'ciel') {
    if (!hasResponseText) return;
    if (refining && !refinedResponse) return;
    setShareError(null);

    let refinedTextForOpen = refinedResponse;
    const needsRefineForAI = !refinedTextForOpen && responseId > 0;
    if (needsRefineForAI) {
      try {
        setPreparingAIVersionTarget(target);
        setRefining(true);
        const result = await refineDailyQuestionResponse({ responseId });
        if (result.error) {
          setShareError(result.error);
          return;
        }
        refinedTextForOpen = result.refinedText;
        setRefinedResponse(result.refinedText);
      } catch (err) {
        console.error('Failed to refine:', err);
        setShareError('Failed to refine response. Please try again.');
        return;
      } finally {
        setRefining(false);
        setPreparingAIVersionTarget(null);
      }
    }

    setAiShareTarget(target);
    setAiSelectedVersion(refinedTextForOpen ? 'refined' : 'original');
    setShowAIVersionSelector(true);
  }

  async function handleConfirmShareWithAI() {
    if (!aiShareTarget || !hasResponseText) return;
    try {
      if (aiShareTarget === 'zero') setSharingWithZero(true);
      if (aiShareTarget === 'ciel') setSharingWithCiel(true);
      setShareError(null);

      const refinedTextToSend =
        aiSelectedVersion === 'refined' || aiSelectedVersion === 'both'
          ? refinedResponse || undefined
          : undefined;

      const result = await shareDailyQuestionWithAI({
        responseId: responseId || undefined,
        questionId,
        question,
        target: aiShareTarget,
        version: aiSelectedVersion,
        responseText: refinedTextToSend,
        originalResponse: originalResponse || response,
        grade,
        feedback,
        thinkHard: thinkHardState[aiShareTarget]?.global
      });

      if (result.error) {
        setShareError(result.error);
        return;
      }

      if (result.channelId) {
        socket.emit('join_chat_group', result.channelId);
      }

      // Update user's coin balance in real-time
      if (result.newCoins !== undefined && userId) {
        onSetUserState({ userId, newState: { twinkleCoins: result.newCoins } });
      }

      if (aiShareTarget === 'zero') setSharedWithZero(true);
      if (aiShareTarget === 'ciel') setSharedWithCiel(true);

      setShowAIVersionSelector(false);
      setAiShareTarget(null);
    } catch (err) {
      console.error('Failed to share with AI:', err);
      setShareError('Failed to share with AI. Please try again.');
    } finally {
      if (aiShareTarget === 'zero') setSharingWithZero(false);
      if (aiShareTarget === 'ciel') setSharingWithCiel(false);
    }
  }

  function handleCancelAIVersionSelector() {
    setShowAIVersionSelector(false);
    setAiShareTarget(null);
  }
}
