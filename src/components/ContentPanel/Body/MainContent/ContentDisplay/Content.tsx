import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
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
import Question from '~/components/Question';
import RichText from '~/components/Texts/RichText';
import SecretAnswer from '~/components/SecretAnswer';
import SecretComment from '~/components/SecretComment';
import UsernameText from '~/components/Texts/UsernameText';
import AIStoryView from './AIStoryView';
import SanitizedHTML from 'react-sanitized-html';
import { useKeyContext } from '~/contexts';
import { Subject, User, Content } from '~/types';
import { returnTheme } from '~/helpers';

Content.propTypes = {
  content: PropTypes.string,
  contentId: PropTypes.number,
  contentObj: PropTypes.object,
  contentType: PropTypes.string,
  description: PropTypes.string,
  difficulty: PropTypes.number,
  isNotification: PropTypes.bool,
  navigate: PropTypes.func.isRequired,
  onClickSecretAnswer: PropTypes.func,
  rootId: PropTypes.number,
  secretAnswer: PropTypes.string,
  secretAttachment: PropTypes.any,
  secretHidden: PropTypes.bool,
  story: PropTypes.string,
  targetObj: PropTypes.object,
  theme: PropTypes.string,
  title: PropTypes.string,
  uploader: PropTypes.object
};
export default function Content({
  content,
  contentId,
  contentType,
  contentObj,
  description,
  difficulty,
  imagePath,
  imageStyle,
  isNotification,
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
  content: string;
  contentId: number;
  contentType: string;
  contentObj: Content;
  description: string;
  difficulty?: number;
  imagePath?: string;
  imageStyle?: string;
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
  const { profileTheme } = useKeyContext((v) => v.myState);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number>();
  const {
    xpNumber: { color: xpNumberColor },
    link: { color: linkColor }
  } = useMemo(() => returnTheme(theme || profileTheme), [profileTheme, theme]);
  const { bonusQuestion, word, level, xpEarned, coinEarned } = useMemo(() => {
    if (contentType !== 'xpChange') {
      return {
        bonusQuestion: null,
        word: '',
        level: 0,
        xpEarned: 0,
        coinEarned: 0
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
            contentId={contentId}
            contentType={contentType}
            difficulty={difficulty}
            imagePath={imagePath}
            imageStyle={imageStyle}
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
            <Question
              key={bonusQuestion.id}
              isGraded={true}
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
            />
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <UsernameText user={uploader} color={Color[linkColor]()} />{' '}
              correctly answered this bonus question and earned{' '}
              <b>
                <span
                  style={{
                    color: Color[xpNumberColor]()
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
    navigate,
    targetObj?.subject?.id,
    rootId,
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
    displayedCoinEarned
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
    </div>
  );
}
