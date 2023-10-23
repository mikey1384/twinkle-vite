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
  rootType = 'mission',
  theme
}: {
  style?: any;
  content: any;
  contentType: string;
  rootType?: string;
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
  const rootPath = useMemo(() => {
    let result = '';
    if (contentType === 'aiStory') {
      result = 'ai-stories';
    } else if (contentType === 'url') {
      result = 'links';
    } else if (contentType === 'pass') {
      result = `${rootType}s`;
    } else {
      result = contentType + 's';
    }
    return result;
  }, [contentType, rootType]);
  const subPath = useMemo(() => {
    if (contentType === 'achievement') return '';
    const path =
      contentType === 'user'
        ? username
        : contentType === 'mission'
        ? rootMissionType || missionType
        : id;
    return path ? `/${path}` : '';
  }, [contentType, id, missionType, rootMissionType, username]);

  const label = useMemo(
    () =>
      contentType === 'user' ? username : title || content || truncatedTopic,
    [content, contentType, title, truncatedTopic, username]
  );

  return label ? (
    <Link
      style={{
        fontWeight: 'bold',
        color: byUser ? Color[userLinkColor]() : Color[linkColor](),
        ...style
      }}
      to={`/${rootPath}${subPath}`}
    >
      {removeLineBreaks(label)}
    </Link>
  ) : (
    <span style={{ fontWeight: 'bold', color: Color.darkerGray() }}>
      (Deleted)
    </span>
  );
}
