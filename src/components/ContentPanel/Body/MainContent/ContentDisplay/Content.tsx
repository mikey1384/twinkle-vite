import React, { useMemo, useState } from 'react';
import { borderRadius, Color } from '~/constants/css';
import {
  cardLevelHash,
  CIEL_TWINKLE_ID,
  ZERO_TWINKLE_ID
} from '~/constants/defaultValues';
import {
  addCommasToNumber,
  stringIsEmpty,
  getRenderedTextForVocabQuestions
} from '~/helpers/stringHelpers';
import MultipleChoiceQuestion from '~/components/MultipleChoiceQuestion';
import RichText from '~/components/Texts/RichText';
import AiEnergySponsorButton, {
  shouldRenderAiEnergySponsorNotice
} from '~/components/Comments/AiEnergySponsorButton';
import SecretAnswer from '~/components/SecretAnswer';
import SecretComment from '~/components/SecretComment';
import UsernameText from '~/components/Texts/UsernameText';
import CardThumb from '~/components/CardThumb';
import Icon from '~/components/Icon';
import AICardModal from '~/components/Modals/AICardModal';
import AIStoryView from './AIStoryView';
import BuildContent from './BuildContent';
import SanitizedHTML from 'react-sanitized-html';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import { Subject, User, Content, Comment } from '~/types';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import DailyReflectionMetaBadges from '~/components/DailyReflectionMetaBadges';
import { hasSubjectSecretSignal } from '~/helpers/subjectSecretHelpers';
import {
  formatRewardMultiplier,
  getDailyTaskRewardMultiplier,
  getDailyTaskRewardMultiplierTier,
  type DailyTaskRewardMultiplierTier
} from '~/helpers/dailyTaskRewardDisplay';

export default function Content({
  audioPath,
  content,
  contentId,
  contentType,
  contentObj,
  description,
  difficulty,
  hasSecretAnswer,
  hasSecretAttachment,
  imagePath,
  imageStyle,
  isNotification,
  isListening,
  isFavorited,
  navigate,
  onClickSecretAnswer,
  rootId,
  secretAnswer,
  secretAttachment,
  secretHidden,
  story,
  targetObj,
  theme,
  title,
  uploader
}: {
  audioPath?: string;
  content: string;
  contentId: number;
  contentType: string;
  contentObj: Content;
  description: string;
  difficulty?: number;
  hasSecretAnswer?: boolean;
  hasSecretAttachment?: boolean;
  imagePath?: string;
  imageStyle?: string;
  isListening?: boolean;
  isNotification: boolean;
  isFavorited?: boolean;
  navigate: (url: string, options?: Record<string, any>) => void;
  onClickSecretAnswer?: () => void;
  rootId: number;
  secretAnswer: string;
  secretAttachment: any;
  secretHidden: boolean;
  story: string;
  targetObj: {
    subject: Subject;
  };
  theme?: string;
  title: string;
  uploader: User;
}) {
  const checkIfUserResponded = useAppContext(
    (v) => v.requestHelpers.checkIfUserResponded
  );
  const onChangeSpoilerStatus = useContentContext(
    (v) => v.actions.onChangeSpoilerStatus
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number>();
  const [cardModalShown, setCardModalShown] = useState(false);
  const { color: linkColor } = useRoleColor('link', {
    themeName: theme,
    fallback: 'logoBlue'
  });
  const { color: xpNumberColor } = useRoleColor('xpNumber', {
    themeName: theme,
    fallback: 'logoGreen'
  });
  const {
    bonusQuestion,
    word,
    level,
    xpEarned,
    coinEarned,
    card,
    dailyTaskReward
  } = useMemo(() => {
    if (contentType !== 'xpChange') {
      return {
        bonusQuestion: null,
        word: '',
        level: 0,
        xpEarned: 0,
        coinEarned: 0,
        card: null,
        dailyTaskReward: null
      };
    }
    return contentObj;
  }, [contentObj, contentType]);
  const subjectHasSecretMessage = useMemo(
    () =>
      contentType === 'subject' &&
      hasSubjectSecretSignal({
        hasSecretAnswer,
        hasSecretAttachment,
        secretAnswer,
        secretAttachment
      }),
    [
      contentType,
      hasSecretAnswer,
      hasSecretAttachment,
      secretAnswer,
      secretAttachment
    ]
  );

  const displayedXPEarned = useMemo(() => {
    return addCommasToNumber(xpEarned);
  }, [xpEarned]);

  const displayedCoinEarned = useMemo(() => {
    return addCommasToNumber(coinEarned);
  }, [coinEarned]);

  const dailyTaskRewardTone = useMemo(() => {
    if (dailyTaskReward?.excellenceQualified) {
      return {
        label: 'Excellence boost',
        color: Color.gold(),
        background: Color.gold(0.14)
      };
    }
    if (dailyTaskReward?.basicQualified) {
      return {
        label: 'Basic boost',
        color: Color.purple(),
        background: Color.purple(0.12)
      };
    }
    return {
      label: 'Base reward',
      color: Color.darkGray(),
      background: Color.black(0.05)
    };
  }, [dailyTaskReward]);

  const { dailyTaskBreakdownText, dailyTaskRewardSummaryText } = useMemo(() => {
    if (!dailyTaskReward) {
      return {
        dailyTaskBreakdownText: '',
        dailyTaskRewardSummaryText: ''
      };
    }

    const appliedBasicMultiplier = Number(
      dailyTaskReward?.basicMultiplier || 1
    );
    const appliedExcellenceMultiplier = Number(
      dailyTaskReward?.excellenceMultiplier || 1
    );
    const appliedFinalMultiplier = Math.max(
      1,
      Number(dailyTaskReward?.finalMultiplier || 1)
    );
    const rawCurrentStreak = Number(dailyTaskReward?.currentStreak);
    const currentStreak = Number.isInteger(rawCurrentStreak)
      ? rawCurrentStreak
      : null;
    const boostParts: string[] = [];

    if (appliedBasicMultiplier > 1) {
      boostParts.push(
        `Basic x${formatRewardMultiplier(appliedBasicMultiplier)}`
      );
    }
    if (appliedExcellenceMultiplier > 1) {
      boostParts.push(
        `Excellence x${formatRewardMultiplier(appliedExcellenceMultiplier)}`
      );
    }

    const streakLabel =
      currentStreak !== null
        ? `${addCommasToNumber(currentStreak)}-day streak`
        : 'Streak boost';
    const dailyTaskBreakdownText = boostParts.length
      ? `${streakLabel} -> ${boostParts.join(' • ')}`
      : `${streakLabel} -> no extra boost`;
    const dailyTaskRewardSummaryText =
      appliedFinalMultiplier > 1
        ? `${displayedCoinEarned} final reward at x${formatRewardMultiplier(
            appliedFinalMultiplier
          )}`
        : `${displayedCoinEarned} final reward`;

    return {
      dailyTaskBreakdownText,
      dailyTaskRewardSummaryText
    };
  }, [dailyTaskReward, displayedCoinEarned]);
  const dailyTaskRewardMultiplier =
    getDailyTaskRewardMultiplier(dailyTaskReward);
  const dailyTaskRewardMultiplierLabel = formatRewardMultiplier(
    dailyTaskRewardMultiplier
  );
  const dailyTaskRewardMultiplierTier =
    getDailyTaskRewardMultiplierTier(dailyTaskRewardMultiplier);
  const dailyTaskRewardMultiplierChipStyle = useMemo(
    () => getDailyTaskRewardMultiplierChipStyle(dailyTaskRewardMultiplierTier),
    [dailyTaskRewardMultiplierTier]
  );

  const Description = useMemo(() => {
    return !stringIsEmpty(description)
      ? description.trim()
      : contentType === 'video' || contentType === 'url'
        ? (title || '').trimEnd()
        : '';
  }, [contentType, description, title]);

  const RenderedContent = useMemo(() => {
    switch (contentType) {
      case 'comment': {
        const commentForAiEnergySponsor = {
          ...contentObj,
          id: contentId,
          content,
          uploader
        } as unknown as Comment;
        if (secretHidden) {
          return (
            <SecretComment
              onMount={async () => {
                const { responded } = await checkIfUserResponded(rootId);
                onChangeSpoilerStatus({
                  shown: responded,
                  subjectId: rootId,
                  prevSecretViewerId: userId
                });
              }}
              onClick={() =>
                navigate(`/subjects/${targetObj?.subject?.id || rootId}`)
              }
            />
          );
        }
        if (isNotification) {
          return (
            <div
              style={{
                color: Color.gray(),
                fontWeight: 'bold',
                borderRadius
              }}
            >
              {uploader?.username} viewed the secret message
            </div>
          );
        }
        if (shouldRenderAiEnergySponsorNotice(commentForAiEnergySponsor)) {
          return (
            <AiEnergySponsorButton
              comment={commentForAiEnergySponsor}
              style={{ margin: '0.5rem 0 1rem' }}
              theme={theme}
            />
          );
        }
        return (
          <RichText
            isAIMessage={
              uploader?.id === Number(ZERO_TWINKLE_ID) ||
              uploader?.id === Number(CIEL_TWINKLE_ID)
            }
            voice={uploader?.id === Number(CIEL_TWINKLE_ID) ? 'nova' : ''}
            contentId={contentId}
            contentType={contentType}
            section="content"
            theme={theme}
          >
            {(content || '').trimEnd()}
          </RichText>
        );
      }
      case 'aiStory':
        return (
          <AIStoryView
            audioPath={audioPath}
            isListening={isListening}
            contentId={contentId}
            contentType={contentType}
            difficulty={difficulty}
            imagePath={imagePath}
            imageStyle={imageStyle}
            title={title}
            topic={contentObj.topic}
            story={story}
            theme={theme}
          />
        );
      case 'build':
        return (
          <BuildContent
            build={{
              id: contentObj.id || contentId,
              userId: contentObj.userId,
              title,
              description,
              isPublic: contentObj.isPublic,
              collaborationMode: contentObj.collaborationMode,
              contributionAccess: contentObj.contributionAccess,
              collaboratorCount: contentObj.collaboratorCount,
              ...(typeof contentObj.forkCount === 'number'
                ? { forkCount: contentObj.forkCount }
                : {}),
              favoritedAt: contentObj.favoritedAt,
              isFavorited: contentObj.isFavorited,
              thumbnailUrl: contentObj.thumbnailUrl,
              updatedAt: contentObj.updatedAt
            }}
            contentId={contentId}
            navigate={navigate}
            theme={theme}
          />
        );
      case 'xpChange': {
        const appliedQuestion = getRenderedTextForVocabQuestions(
          bonusQuestion.question,
          word,
          cardLevelHash[level]?.color || 'green'
        );
        const hasSelection = typeof selectedChoiceIndex === 'number';
        const isCorrect =
          hasSelection && selectedChoiceIndex === bonusQuestion.answerIndex;
        const conditionStatus = hasSelection
          ? isCorrect
            ? 'pass'
            : 'fail'
          : '';
        return (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              flexDirection: 'column',
              width: '100%',
              padding: '0 2rem',
              marginBottom: '-3rem'
            }}
          >
            {card && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '1.6rem'
                }}
              >
                <CardThumb
                  detailed
                  card={card}
                  onClick={() => setCardModalShown(true)}
                />
              </div>
            )}
            {dailyTaskReward && (
              <div
                style={{
                  marginBottom: '1.4rem',
                  padding: '1rem 1.1rem',
                  borderRadius,
                  border: `1px solid ${Color.borderGray()}`,
                  background: Color.whiteGray(),
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.8rem'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '0.6rem'
                  }}
                >
                  <div
                    style={{
                      padding: '0.35rem 0.8rem',
                      borderRadius: '999px',
                      background: dailyTaskRewardTone.background,
                      color: dailyTaskRewardTone.color,
                      fontWeight: 700
                    }}
                  >
                    {dailyTaskRewardTone.label}
                  </div>
                  <span
                    aria-label={`Daily goals reward multiplier x${dailyTaskRewardMultiplierLabel}`}
                    style={dailyTaskRewardMultiplierChipStyle}
                  >
                    <Icon
                      icon="bolt"
                      style={{ color: 'currentColor', fontSize: '1rem' }}
                    />
                    {`x${dailyTaskRewardMultiplierLabel}`}
                  </span>
                </div>
                <div
                  style={{
                    textAlign: 'center',
                    fontSize: '1.1rem',
                    color: Color.darkGray(),
                    lineHeight: 1.5
                  }}
                >
                  {dailyTaskBreakdownText}
                </div>
                <div
                  style={{
                    textAlign: 'center',
                    fontSize: '1.15rem',
                    color: Color.darkGray(),
                    lineHeight: 1.5
                  }}
                >
                  {dailyTaskRewardSummaryText}
                </div>
              </div>
            )}
            <MultipleChoiceQuestion
              key={bonusQuestion.id}
              isGraded={hasSelection}
              question={
                <SanitizedHTML
                  allowedAttributes={{ b: ['style'] }}
                  html={appliedQuestion as string}
                />
              }
              choices={bonusQuestion.choices}
              selectedChoiceIndex={selectedChoiceIndex}
              answerIndex={bonusQuestion.answerIndex}
              onSelectChoice={setSelectedChoiceIndex}
              conditionPassStatus={conditionStatus}
              allowReselect={!isCorrect}
              style={{ marginBottom: '2rem' }}
            />
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <UsernameText user={uploader} color={linkColor} /> correctly
              answered this bonus question and earned{' '}
              <b>
                <span
                  style={{
                    color: xpNumberColor
                  }}
                >
                  {displayedXPEarned}
                </span>{' '}
                <span style={{ color: Color.gold() }}>XP</span>
              </b>{' '}
              on top of{' '}
              <b style={{ color: Color.brownOrange() }}>
                {displayedCoinEarned} coins
              </b>{' '}
              from today's Daily Tasks reward
            </div>
          </div>
        );
      }
      case 'sharedTopic':
        return (
          <div style={{ width: '100%' }}>
            {contentObj?.customInstructions && (
              <div
                style={{
                  marginTop: '0.5rem',
                  padding: '1rem',
                  borderRadius,
                  border: `1px solid ${Color.borderGray()}`,
                  background: Color.wellGray()
                }}
              >
                <div
                  style={{
                    fontWeight: 'bold',
                    marginBottom: '0.5rem',
                    color: Color.darkerGray()
                  }}
                >
                  System Prompt:
                </div>
                <RichText
                  contentId={contentId}
                  contentType={contentType}
                  section="content"
                  theme={theme}
                >
                  {contentObj.customInstructions}
                </RichText>
              </div>
            )}
          </div>
        );
      case 'dailyReflection':
        return (
          <div style={{ width: '100%' }}>
            {contentObj?.question && (
              <div
                style={{
                  marginBottom: '1rem',
                  padding: '1rem',
                  borderRadius,
                  border: `1px solid ${Color.borderGray()}`,
                  background: Color.wellGray()
                }}
              >
                <div
                  style={{
                    fontWeight: 'bold',
                    marginBottom: '0.5rem',
                    color: Color.darkerGray()
                  }}
                >
                  Question:
                </div>
                <div style={{ fontStyle: 'italic' }}>{contentObj.question}</div>
              </div>
            )}
            <RichText
              contentId={contentId}
              contentType={contentType}
              section="description"
              theme={theme}
            >
              {description || ''}
            </RichText>
            <DailyReflectionMetaBadges
              grade={contentObj?.grade}
              isRefined={contentObj?.isRefined}
              masterpieceType={contentObj?.masterpieceType}
              xpAwarded={contentObj?.xpAwarded}
              streak={contentObj?.streakAtTime}
              style={{ marginTop: '1rem' }}
            />
            {!!contentObj?.shareCoinsAwarded && (
              <div
                style={{
                  marginTop: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '1.2rem',
                  color: Color.darkerGray()
                }}
              >
                <span>
                  <UsernameText user={uploader} color={linkColor} /> was
                  rewarded{' '}
                  <b style={{ color: Color.orange() }}>
                    {addCommasToNumber(contentObj?.shareCoinsAwarded)} coins
                  </b>{' '}
                  for sharing this
                </span>
              </div>
            )}
          </div>
        );
      default:
        return Description ? (
          <div
            style={{
              width: '100%',
              marginTop: contentType === 'url' ? '-1rem' : 0,
              marginBottom:
                contentType === 'url' || contentType === 'subject'
                  ? '1rem'
                  : '0.5rem'
            }}
          >
            <RichText
              contentId={contentId}
              contentType={contentType}
              section="description"
              theme={theme}
            >
              {Description}
            </RichText>
          </div>
        ) : null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    contentType,
    secretHidden,
    isNotification,
    contentObj,
    uploader,
    contentId,
    theme,
    content,
    difficulty,
    imagePath,
    imageStyle,
    isFavorited,
    story,
    Description,
    rootId,
    userId,
    navigate,
    targetObj?.subject?.id,
    bonusQuestion?.question,
    bonusQuestion?.id,
    bonusQuestion?.choices,
    bonusQuestion?.answerIndex,
    word,
    level,
    selectedChoiceIndex,
    linkColor,
    xpNumberColor,
    displayedXPEarned,
    displayedCoinEarned,
    dailyTaskReward,
    dailyTaskRewardTone,
    dailyTaskBreakdownText,
    dailyTaskRewardSummaryText,
    dailyTaskRewardMultiplierChipStyle,
    dailyTaskRewardMultiplierLabel,
    card,
    card?.id
  ]);

  return (
    <div>
      {contentType === 'subject' && (
        <div
          style={{
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
            wordBreak: 'break-word'
          }}
        >
          <p
            style={{
              marginTop: '0.7rem',
              marginBottom: '1.7rem',
              fontWeight: 'bold',
              fontSize: '2.2rem'
            }}
          >
            {title}
          </p>
        </div>
      )}
      {RenderedContent}
      {subjectHasSecretMessage && (
        <SecretAnswer
          answer={secretAnswer}
          theme={theme}
          attachment={secretAttachment}
          onClick={onClickSecretAnswer}
          subjectId={contentId}
          uploaderId={uploader.id}
        />
      )}
      {cardModalShown && card?.id && (
        <AICardModal cardId={card.id} onHide={() => setCardModalShown(false)} />
      )}
    </div>
  );
}

function getDailyTaskRewardMultiplierChipStyle(
  tier: DailyTaskRewardMultiplierTier
): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    minHeight: '2rem',
    padding: '0.35rem 0.8rem',
    border: '1px solid transparent',
    borderRadius: '999px',
    background: Color.black(0.05),
    color: Color.darkGray(),
    fontWeight: 800,
    lineHeight: 1,
    whiteSpace: 'nowrap'
  };

  if (tier === 'active') {
    return {
      ...baseStyle,
      borderColor: Color.logoBlue(0.2),
      background: Color.logoBlue(0.12),
      color: Color.logoBlue()
    };
  }
  if (tier === 'strong') {
    return {
      ...baseStyle,
      borderColor: Color.logoGreen(0.3),
      background: Color.logoGreen(0.14),
      color: Color.green()
    };
  }
  if (tier === 'major') {
    return {
      ...baseStyle,
      borderColor: Color.gold(0.38),
      background: Color.gold(0.17),
      color: Color.orange(),
      boxShadow: `0 0.08rem 0.32rem ${Color.gold(0.2)}`
    };
  }
  if (tier === 'epic') {
    return {
      ...baseStyle,
      minHeight: '2.12rem',
      padding: '0.35rem 0.72rem',
      borderColor: Color.strongPink(0.28),
      background: Color.pink(0.13),
      color: Color.rose(),
      fontSize: '1.14rem',
      boxShadow: `0 0.08rem 0.42rem ${Color.pink(0.17)}`
    };
  }
  if (tier === 'legendary') {
    return {
      ...baseStyle,
      minHeight: '2.18rem',
      padding: '0.35rem 0.78rem',
      borderColor: Color.gold(0.55),
      background: `linear-gradient(135deg, ${Color.black()}, rgba(98, 73, 18, 1))`,
      color: Color.brightGold(),
      fontSize: '1.18rem',
      boxShadow: `0 0.1rem 0.55rem ${Color.gold(0.22)}`
    };
  }

  return baseStyle;
}
