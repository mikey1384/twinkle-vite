import React, { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { borderRadius, Color } from '~/constants/css';
import {
  cardLevelHash,
  CIEL_TWINKLE_ID,
  ZERO_TWINKLE_ID
} from '~/constants/defaultValues';
import {
  stringIsEmpty,
  getRenderedTextForVocabQuestions
} from '~/helpers/stringHelpers';
import Question from '~/components/Question';
import RichText from '~/components/Texts/RichText';
import SecretAnswer from '~/components/SecretAnswer';
import SecretComment from '~/components/SecretComment';
import SanitizedHTML from 'react-sanitized-html';
import { css } from '@emotion/css';
import { Subject, User, Content } from '~/types';

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
  const [fadeIn, setFadeIn] = useState(false);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number>();
  const { bonusQuestion, word, level } = useMemo(() => {
    if (contentType !== 'xpChange') {
      return { bonusQuestion: null, word: '', level: 0 };
    }
    return contentObj;
  }, [contentObj, contentType]);

  useEffect(() => {
    setFadeIn(true);
  }, []);

  const difficultyColor = useMemo(() => {
    switch (difficulty) {
      case 1:
        return '#D0EBFF';
      case 2:
        return '#FCE4EC';
      case 3:
        return '#FAD7A0';
      case 4:
        return '#F4D7FA';
      case 5:
        return Color.gold(0.5);
      default:
        return '#f0f8ff';
    }
  }, [difficulty]);

  const borderColor = useMemo(() => {
    const colors: {
      [key: number]: string;
    } = {
      1: '#B3D1E0',
      2: '#F2C1C6',
      3: '#E6B280',
      4: '#E1BAE8',
      5: '#E6C85F'
    };
    return colors[difficulty || 1] || '#a4b8c4';
  }, [difficulty]);

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
          <div
            className={css`
              width: 100%;
              margin-top: 0;
              margin-bottom: 0.5rem;
              background-color: ${difficultyColor};
              padding: 1rem;
              border: 1px solid ${borderColor};
              border-radius: 10px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              font-family: 'Poppins', sans-serif;
              font-size: 1.6rem;
              transition: box-shadow 0.2s ease;
              line-height: 1.7;

              &:hover {
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
              }

              opacity: 0;
              animation: ${fadeIn ? 'fadein 1s ease forwards' : 'none'};
              @keyframes fadein {
                from {
                  opacity: 0;
                }
                to {
                  opacity: 1;
                }
              }
            `}
          >
            <RichText
              contentId={contentId}
              contentType={contentType}
              section="description"
              theme={theme}
              style={{ color: '#000' }}
            >
              {story}
            </RichText>
          </div>
        );
      case 'xpChange': {
        const appliedQuestion = getRenderedTextForVocabQuestions(
          bonusQuestion.question,
          word,
          cardLevelHash[level]?.color || 'green'
        );
        return (
          <div>
            <Question
              key={bonusQuestion.id}
              isGraded={false}
              question={
                <SanitizedHTML
                  allowedAttributes={{ b: ['style'] }}
                  html={appliedQuestion as string}
                />
              }
              choices={bonusQuestion.choices}
              selectedChoiceIndex={selectedChoiceIndex}
              answerIndex={bonusQuestion.answerIndex}
              onSelectChoice={(index) => setSelectedChoiceIndex(index)}
            />
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
    uploader?.id,
    uploader?.username,
    contentId,
    theme,
    content,
    difficultyColor,
    borderColor,
    fadeIn,
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
    selectedChoiceIndex
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
