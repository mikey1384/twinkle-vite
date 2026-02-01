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
import SecretAnswer from '~/components/SecretAnswer';
import SecretComment from '~/components/SecretComment';
import UsernameText from '~/components/Texts/UsernameText';
import CardThumb from '~/components/CardThumb';
import AICardModal from '~/components/Modals/AICardModal';
import AIStoryView from './AIStoryView';
import SanitizedHTML from 'react-sanitized-html';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import { Subject, User, Content } from '~/types';
import { useRoleColor } from '~/theme/useRoleColor';
import XPAndStreakDisplay from '~/components/XPAndStreakDisplay';

export default function Content({
  audioPath,
  content,
  contentId,
  contentType,
  contentObj,
  description,
  difficulty,
  imagePath,
  imageStyle,
  isNotification,
  isListening,
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
  imagePath?: string;
  imageStyle?: string;
  isListening?: boolean;
  isNotification: boolean;
  navigate: (url: string) => void;
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
  const { bonusQuestion, word, level, xpEarned, coinEarned, card } =
    useMemo(() => {
      if (contentType !== 'xpChange') {
        return {
          bonusQuestion: null,
          word: '',
          level: 0,
          xpEarned: 0,
          coinEarned: 0,
          card: null
        };
      }
      return contentObj;
    }, [contentObj, contentType]);

  const displayedXPEarned = useMemo(() => {
    return addCommasToNumber(xpEarned);
  }, [xpEarned]);

  const displayedCoinEarned = useMemo(() => {
    return addCommasToNumber(coinEarned);
  }, [coinEarned]);

  const Description = useMemo(() => {
    return !stringIsEmpty(description)
      ? description.trim()
      : contentType === 'video' || contentType === 'url'
      ? (title || '').trimEnd()
      : '';
  }, [contentType, description, title]);
  const RenderedContent = useMemo(() => {
    switch (contentType) {
      case 'comment':
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
              from completing all daily goals
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
            {contentObj?.grade === 'Masterpiece' && (
              <div
                style={{
                  marginTop: '1rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.4rem 0.8rem',
                  background: `linear-gradient(135deg, ${Color.gold()}20, ${Color.orange()}20)`,
                  border: `1px solid ${Color.gold()}`,
                  borderRadius: '1rem',
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  color: Color.gold()
                }}
              >
                <span>★</span>
                <span>
                  {contentObj?.masterpieceType
                    ? `Masterpiece (${contentObj.masterpieceType.replace(/_/g, ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')})`
                    : 'Masterpiece'}
                </span>
              </div>
            )}
            <XPAndStreakDisplay
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
            {contentObj?.isRefined && (
              <div
                style={{
                  marginTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '1.2rem',
                  color: Color.darkerGray()
                }}
              >
                <span style={{ color: Color.logoBlue() }}>✨</span>
                <span style={{ fontStyle: 'italic' }}>AI-polished</span>
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
    uploader,
    contentId,
    theme,
    content,
    difficulty,
    imagePath,
    imageStyle,
    story,
    Description,
    checkIfUserResponded,
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
      {(secretAnswer || secretAttachment) && (
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
