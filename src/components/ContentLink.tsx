import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Color } from '~/constants/css';
import { useTheme } from '~/helpers/hooks';
import { removeLineBreaks, truncateTopic } from '~/helpers/stringHelpers';
import { useKeyContext } from '~/contexts';

export default function ContentLink({
  style,
  content: {
    byUser,
    id,
    content,
    missionType,
    rootMissionType,
    topic,
    title,
    username
  },
  contentType,
  theme
}: {
  style?: any;
  content: any;
  contentType: string;
  theme?: string;
}) {
  const truncatedTopic = useMemo(() => {
    return topic ? truncateTopic(topic) : '';
  }, [topic]);
  const { profileTheme } = useKeyContext((v) => v.myState);
  const {
    userLink: { color: userLinkColor },
    link: { color: linkColor }
  } = useTheme(theme || profileTheme);
  const destination = useMemo(() => {
    let result = '';
    if (contentType === 'aiStory') {
      result = 'ai-stories';
    } else if (contentType === 'url') {
      result = 'links';
    } else if (contentType === 'pass') {
      result = 'missions';
    } else {
      result = contentType + 's';
    }
    return result;
  }, [contentType]);

  const label = title || content || username || truncatedTopic;

  return label ? (
    <Link
      style={{
        fontWeight: 'bold',
        color: byUser ? Color[userLinkColor]() : Color[linkColor](),
        ...style
      }}
      to={`/${destination}/${
        contentType === 'user'
          ? username
          : contentType === 'mission'
          ? rootMissionType || missionType
          : id
      }`}
    >
      {removeLineBreaks(label)}
    </Link>
  ) : (
    <span style={{ fontWeight: 'bold', color: Color.darkerGray() }}>
      (Deleted)
    </span>
  );
}
