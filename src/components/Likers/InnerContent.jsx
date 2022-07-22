import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import UsernameText from '~/components/Texts/UsernameText';
import { Color } from '~/constants/css';
import { useTheme } from '~/helpers/hooks';
import { useKeyContext } from '~/contexts';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';

InnerContent.propTypes = {
  likes: PropTypes.array,
  userId: PropTypes.number,
  wordBreakEnabled: PropTypes.bool,
  onLinkClick: PropTypes.func,
  target: PropTypes.string,
  defaultText: PropTypes.string,
  theme: PropTypes.string
};

export default function InnerContent({
  likes = [],
  userId,
  wordBreakEnabled,
  onLinkClick,
  target,
  defaultText = '',
  theme
}) {
  const { profileTheme } = useKeyContext((v) => v.myState);
  const {
    link: { color: linkColor }
  } = useTheme(theme || profileTheme);
  const userLiked = useMemo(() => {
    for (let like of likes) {
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
        if (SELECTED_LANGUAGE === 'kr') {
          return (
            <div>
              회원님과{' '}
              <UsernameText
                wordBreakEnabled={wordBreakEnabled}
                color={Color[linkColor]()}
                user={{
                  id: otherLikes[0]?.id,
                  username: otherLikes[0]?.username
                }}
              />
              님이 이 게시물을 좋아합니다.
            </div>
          );
        }
        return (
          <div>
            You and{' '}
            <UsernameText
              wordBreakEnabled={wordBreakEnabled}
              color={Color[linkColor]()}
              user={{
                id: otherLikes[0]?.id,
                username: otherLikes[0]?.username
              }}
            />{' '}
            like {`this${target ? ' ' + target : ''}.`}
          </div>
        );
      } else {
        if (SELECTED_LANGUAGE === 'kr') {
          return (
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
          );
        }
        return (
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
        );
      }
    }
    if (SELECTED_LANGUAGE === 'kr') {
      return <div>회원님이 이 게시물을 좋아합니다.</div>;
    }
    return <div>You like {`this${target ? ' ' + target : ''}.`}</div>;
  } else if (totalLikes > 0) {
    if (totalLikes === 1) {
      if (SELECTED_LANGUAGE === 'kr') {
        return (
          <div>
            <UsernameText
              wordBreakEnabled={wordBreakEnabled}
              color={Color[linkColor]()}
              user={likes[0]}
            />
            님이 이 게시물을 좋아합니다.
          </div>
        );
      }
      return (
        <div>
          <UsernameText
            wordBreakEnabled={wordBreakEnabled}
            color={Color[linkColor]()}
            user={likes[0]}
          />{' '}
          likes {`this${target ? ' ' + target : ''}.`}
        </div>
      );
    } else {
      if (SELECTED_LANGUAGE === 'kr') {
        return (
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
        );
      }
      return (
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
      );
    }
  } else {
    return <div>{defaultText}</div>;
  }
}
