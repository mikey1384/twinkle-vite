import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Color } from '~/constants/css';
import { removeLineBreaks, truncateTopic } from '~/helpers/stringHelpers';
import { useRoleColor } from '~/theme/useRoleColor';

export default function ContentLink({
  style,
  content: {
    byUser,
    id,
    content,
    missionType,
    rootMissionType,
    title,
    topic,
    username
  },
  contentType,
  label,
  rootType = 'mission',
  theme
}: {
  style?: any;
  content: any;
  contentType: string;
  label?: string;
  rootType?: string;
  theme?: string;
}) {
  const truncatedTopic = useMemo(() => {
    return topic ? truncateTopic(topic) : '';
  }, [topic]);
  const { color: userLinkColor } = useRoleColor('userLink', {
    themeName: theme,
    fallback: 'logoBlue'
  });
  const { color: linkColor } = useRoleColor('link', {
    themeName: theme,
    fallback: 'logoBlue'
  });
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

  const appliedLabel = useMemo(() => {
    return !label && contentType === 'user'
      ? username
      : label || title || content || truncatedTopic;
  }, [content, contentType, label, title, truncatedTopic, username]);

  return appliedLabel ? (
    <Link
      style={{
        fontWeight: 'bold',
        color: byUser ? userLinkColor : linkColor,
        ...style
      }}
      to={`/${rootPath}${subPath}`}
    >
      {removeLineBreaks(appliedLabel)}
    </Link>
  ) : (
    <span style={{ fontWeight: 'bold', color: Color.darkerGray() }}>
      (Deleted)
    </span>
  );
}
