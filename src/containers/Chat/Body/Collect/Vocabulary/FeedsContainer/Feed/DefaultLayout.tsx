import React, { useMemo, useState } from 'react';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import WordModal from '../../VocabularyWidget/WordModal';
import Icon from '~/components/Icon';
import { mobileMaxWidth, wideBorderRadius } from '~/constants/css';
import { css } from '@emotion/css';
import { wordLevelHash } from '~/constants/defaultValues';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';

export default function DefaultLayout({
  feedRef,
  userId,
  username,
  profilePicUrl,
  action,
  content,
  wordLevel,
  xpReward,
  coinReward,
  totalPoints,
  displayedTime,
  getRGBA,
  getActionColor,
  badgeStyle,
  getWordFontSize
}: {
  feedRef: React.RefObject<HTMLDivElement>;
  userId: number;
  username: string;
  profilePicUrl: string;
  action: string;
  content: string;
  wordLevel: number;
  xpReward: number;
  coinReward: number;
  totalPoints: number;
  displayedTime: string;
  getRGBA: (colorName: string, opacity?: number) => string;
  getActionColor: (action: string) => string;
  getWordFontSize: (wordLevel: number) => string;
  badgeStyle: (colorName: string, opacity?: number) => string;
}) {
  const [wordModalShown, setWordModalShown] = useState(false);

  const colorName = wordLevelHash[wordLevel]?.color || 'logoBlue';
  const backgroundColor = getRGBA(colorName, 0.08);
  const borderColor = getRGBA(colorName, 0.7);
  const actionColor = getActionColor(action);
  const wordFontSize = getWordFontSize(wordLevel);

  // "actionLabel" can be replaced with your original switch logic
  const actionLabel = useMemo(() => {
    switch (action) {
      case 'register':
        return 'Discovered';
      case 'hit':
        return 'Collected';
      case 'apply':
        return 'Applied';
      case 'answer':
        return 'Answered';
      // ... etc.
      default:
        return 'Performed an Action';
    }
  }, [action]);

  // Example of rendering extra details for certain actions
  // (like the "apply"/"answer" logic you had)
  const actionDetails = useMemo(() => {
    switch (action) {
      case 'apply':
        return (
          <div
            className={css`
              margin-top: 0.8rem;
              border-radius: 0.5rem;
              background: #f5f5f5;
              padding: 0.8rem;
              font-style: italic;
              box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
            `}
          >
            <strong>Example sentence:</strong>
            <br />
            &ldquo;I can <b>{content}</b> my skills in everyday life by
            practicing regularly.&rdquo;
          </div>
        );
      case 'answer':
        return (
          <div
            className={css`
              margin-top: 0.8rem;
              border-radius: 0.5rem;
              background: #f5f5f5;
              padding: 0.8rem;
              font-style: italic;
              box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
            `}
          >
            <strong>Multiple choice question:</strong>
            <br />
            &ldquo;What does <b>{content}</b> mean?&rdquo;
            <ul
              className={css`
                list-style-type: none;
                margin-top: 0.5rem;
                padding-left: 0;
                li {
                  margin-bottom: 0.3rem;
                }
              `}
            >
              <li>A) [Placeholder definition 1]</li>
              <li>B) [Placeholder definition 2]</li>
              <li>C) [Placeholder definition 3]</li>
              <li>D) [Placeholder definition 4]</li>
            </ul>
          </div>
        );
      default:
        return null;
    }
  }, [action, content]);

  return (
    <div
      ref={feedRef}
      className={css`
        display: grid;
        grid-template-columns: 60px 1fr 140px;
        grid-template-areas: 'avatar content stats';
        gap: 1rem;
        padding: 1.2rem 1rem;
        background-color: ${backgroundColor};
        border-left: 8px solid ${borderColor};
        border-radius: ${wideBorderRadius};
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
        margin-bottom: 1.5rem;

        @media (max-width: ${mobileMaxWidth}) {
          grid-template-columns: 60px 1fr;
          grid-template-rows: auto auto;
          grid-template-areas:
            'avatar content'
            'stats stats';
        }
      `}
    >
      <div
        className={css`
          grid-area: avatar;
          display: flex;
          flex-direction: column;
          align-items: flex-start;

          @media (max-width: ${mobileMaxWidth}) {
            align-items: center;
          }

          .profilePicContainer {
            width: 60px;
            min-width: 60px;
            @media (max-width: ${mobileMaxWidth}) {
              width: 50px;
              min-width: 50px;
            }
          }
        `}
      >
        <div className="profilePicContainer">
          <ProfilePic userId={userId} profilePicUrl={profilePicUrl} />
        </div>
        <div
          className={css`
            width: 100%;
            max-width: 100%;
            margin-top: 0.4rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-align: center;
          `}
        >
          <UsernameText
            className={css`
              font-weight: 600;
              color: #444;
              font-size: 1.2rem;
            `}
            user={{ id: userId, username }}
          />
        </div>
      </div>

      <div
        className={css`
          grid-area: content;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        `}
      >
        <div
          className={css`
            ${badgeStyle(actionColor, 0.85)}
            color: #fff;
            font-size: 1.1rem;
            font-weight: 700;
            text-align: center;
            width: fit-content;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1rem;
            }
          `}
        >
          {actionLabel}
        </div>

        {/* Word level + Word itself */}
        {wordLevelHash[wordLevel]?.label && (
          <div>
            <span
              className={css`
                display: inline-block;
                padding: 0.4rem 0.8rem;
                border-radius: 1rem;
                margin-right: 0.6rem;
                font-size: 1rem;
                font-weight: 600;
                color: #fff;
                background: ${getRGBA(colorName, 1)};
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
              `}
            >
              {wordLevelHash[wordLevel]?.label}
            </span>

            <span
              className={css`
                font-weight: bold;
                cursor: pointer;
                margin-left: 0.5rem;
                color: ${getRGBA('logoBlue', 1)};
                font-size: ${wordFontSize};
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 90vw;

                &:hover {
                  text-decoration: underline;
                  transition: all 0.15s ease-in;
                }

                @media (max-width: ${mobileMaxWidth}) {
                  max-width: 55vw;
                }
              `}
              onClick={() => setWordModalShown(true)}
              title={content}
            >
              {content}
            </span>
          </div>
        )}

        {actionDetails}

        <div
          className={css`
            margin-top: 0.4rem;
            font-size: 0.9rem;
            color: #666;
          `}
        >
          <span>{displayedTime}</span>
        </div>
      </div>

      {Number(totalPoints) > 0 && (
        <div
          className={css`
            grid-area: stats;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 0.5rem;
            @media (max-width: ${mobileMaxWidth}) {
              flex-direction: row;
              flex-wrap: wrap;
              justify-content: center;
              align-items: center;
            }
          `}
        >
          <div className={badgeStyle('passionFruit', 0.85)}>
            <span className="label">
              {addCommasToNumber(totalPoints)}{' '}
              {Number(totalPoints) === 1 ? 'pt' : 'pts'}
            </span>
          </div>

          {xpReward > 0 && (
            <div className={badgeStyle('limeGreen', 0.85)}>
              <Icon icon={['far', 'star']} />
              <span className="label">{addCommasToNumber(xpReward)} XP</span>
            </div>
          )}

          {coinReward > 0 && (
            <div className={badgeStyle('gold', 0.85)}>
              <Icon icon={['far', 'badge-dollar']} />
              <span className="label">{addCommasToNumber(coinReward)}</span>
            </div>
          )}
        </div>
      )}

      {wordModalShown && (
        <WordModal word={content} onHide={() => setWordModalShown(false)} />
      )}
    </div>
  );
}
