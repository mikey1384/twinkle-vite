import React, { useMemo } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color } from '~/constants/css';
import { returnTheme } from '~/helpers';
import { useKeyContext } from '~/contexts';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';

export default function InnerContent({
  likes = [],
  userId,
  wordBreakEnabled,
  onLinkClick,
  target,
  defaultText = '',
  theme
}: {
  likes?: Array<{ id: number; username: string }>;
  userId: number;
  wordBreakEnabled?: boolean;
  onLinkClick: () => void;
  target?: string;
  defaultText?: string;
  theme?: any;
}) {
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const {
    link: { color: linkColor }
  } = useMemo(() => returnTheme(theme || profileTheme), [profileTheme, theme]);
  const userLiked = useMemo(() => {
    for (const like of likes) {
      if (like?.id === userId) {
        return true;
      }
    }
    return false;
  }, [likes, userId]);

  const totalLikes = useMemo(() => {
    return userLiked ? likes.length - 1 : likes.length;
  }, [likes.length, userLiked]);

  const otherLikes = useMemo(
    () => likes.filter((like) => like?.id !== userId),
    [likes, userId]
  );

  if (userLiked) {
    if (totalLikes > 0) {
      if (totalLikes === 1) {
        const firstOtherLike = otherLikes[0];
        if (!firstOtherLike) return null;

        if (SELECTED_LANGUAGE === 'kr') {
          return (
            <ErrorBoundary componentPath="Likers/InnerContent/YouAndOneTotalLike/KR">
              <div>
                회원님과{' '}
                <UsernameText
                  wordBreakEnabled={wordBreakEnabled}
                  color={Color[linkColor]()}
                  user={{
                    id: firstOtherLike.id,
                    username: firstOtherLike.username
                  }}
                />
                님이 이 게시물을 좋아합니다.
              </div>
            </ErrorBoundary>
          );
        }
        return (
          <ErrorBoundary componentPath="Likers/InnerContent/YouAndOneTotalLike/EN">
            <div>
              You and{' '}
              <UsernameText
                wordBreakEnabled={wordBreakEnabled}
                color={Color[linkColor]()}
                user={{
                  id: firstOtherLike.id,
                  username: firstOtherLike.username
                }}
              />{' '}
              like {`this${target ? ' ' + target : ''}.`}
            </div>
          </ErrorBoundary>
        );
      } else {
        if (SELECTED_LANGUAGE === 'kr') {
          return (
            <ErrorBoundary componentPath="Likers/InnerContent/YouAndMultiTotalLikes/KR">
              <div>
                회원님과{' '}
                <a
                  style={{ cursor: 'pointer', fontWeight: 'bold' }}
                  onClick={() => onLinkClick()}
                >
                  {totalLikes}
                </a>
                명의 회원님들이 이 게시물을 좋아합니다
              </div>
            </ErrorBoundary>
          );
        }
        return (
          <ErrorBoundary componentPath="Likers/InnerContent/YouAndMultiTotalLikes/EN">
            <div>
              You and{' '}
              <a
                style={{
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  color: Color[linkColor]()
                }}
                onClick={() => onLinkClick()}
              >
                {totalLikes} others
              </a>{' '}
              like {`this${target ? ' ' + target : ''}.`}
            </div>
          </ErrorBoundary>
        );
      }
    }
    if (SELECTED_LANGUAGE === 'kr') {
      return (
        <ErrorBoundary componentPath="Likers/InnerContent/YouLike/KR">
          <div>회원님이 이 게시물을 좋아합니다.</div>
        </ErrorBoundary>
      );
    }
    return (
      <ErrorBoundary componentPath="Likers/InnerContent/YouLike/EN">
        <div>You like {`this${target ? ' ' + target : ''}.`}</div>
      </ErrorBoundary>
    );
  } else if (totalLikes > 0) {
    if (totalLikes === 1) {
      const firstLike = likes[0];
      if (!firstLike) return null;

      if (SELECTED_LANGUAGE === 'kr') {
        return (
          <ErrorBoundary componentPath="Likers/InnerContent/OneTotalLike/KR">
            <div>
              <UsernameText
                wordBreakEnabled={wordBreakEnabled}
                color={Color[linkColor]()}
                user={firstLike}
              />
              님이 이 게시물을 좋아합니다.
            </div>
          </ErrorBoundary>
        );
      }
      return (
        <ErrorBoundary componentPath="Likers/InnerContent/OneTotalLike/EN">
          <div>
            <UsernameText
              wordBreakEnabled={wordBreakEnabled}
              color={Color[linkColor]()}
              user={firstLike}
            />{' '}
            likes {`this${target ? ' ' + target : ''}.`}
          </div>
        </ErrorBoundary>
      );
    } else {
      if (SELECTED_LANGUAGE === 'kr') {
        return (
          <ErrorBoundary componentPath="Likers/InnerContent/MultiTotalLikes/KR">
            <div>
              <a
                style={{
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  color: Color[linkColor]()
                }}
                onClick={() => onLinkClick()}
              >
                {totalLikes}
              </a>
              명의 회원님들이 이 게시물을 좋아합니다.
            </div>
          </ErrorBoundary>
        );
      }
      return (
        <ErrorBoundary componentPath="Likers/InnerContent/MultiTotalLikes/EN">
          <div>
            <a
              style={{
                cursor: 'pointer',
                fontWeight: 'bold',
                color: Color[linkColor]()
              }}
              onClick={() => onLinkClick()}
            >
              {totalLikes} people
            </a>{' '}
            like {`this${target ? ' ' + target : ''}.`}
          </div>
        </ErrorBoundary>
      );
    }
  } else {
    return (
      <ErrorBoundary componentPath="Likers/InnerContent/Default">
        <div>{defaultText}</div>
      </ErrorBoundary>
    );
  }
}
