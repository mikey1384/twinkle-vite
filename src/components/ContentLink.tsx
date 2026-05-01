import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Color } from '~/constants/css';
import { removeLineBreaks, truncateTopic } from '~/helpers/stringHelpers';
import { useRoleColor } from '~/theme/useRoleColor';
import { getBuildDisplayTitle } from '~/containers/Build/BuildEditor/buildRelationshipLabels';

export default function ContentLink({
  style,
  content: contentObj,
  contentType,
  label,
  rootType: _rootType = 'mission',
  theme
}: {
  style?: any;
  content: any;
  contentType: string;
  label?: string;
  rootType?: string;
  theme?: string;
}) {
  const {
    byUser,
    id,
    content,
    missionType,
    rootMissionType,
    title,
    topic,
    username,
    word
  } = contentObj || {};
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
  const isPassType =
    contentType === 'pass' ||
    contentType === 'missionPass' ||
    contentType === 'achievementPass';
  const isAchievementPass =
    contentType === 'achievementPass' || _rootType === 'achievement';
  const buildPath = useMemo(() => {
    return id ? `/app/${id}` : '';
  }, [id]);
  const rootPath = useMemo(() => {
    let result = '';
    if (contentType === 'build') {
      result = '';
    } else if (contentType === 'aiStory') {
      result = 'ai-stories';
    } else if (contentType === 'url') {
      result = 'links';
    } else if (isPassType) {
      result = isAchievementPass ? 'achievement-unlocks' : 'mission-passes';
    } else if (contentType === 'xpChange') {
      result = 'daily-rewards';
    } else if (contentType === 'sharedTopic') {
      result = 'shared-prompts';
    } else if (contentType === 'dailyReflection') {
      result = 'daily-reflections';
    } else {
      result = contentType + 's';
    }
    return result;
  }, [contentType, isPassType, isAchievementPass]);
  const subPath = useMemo(() => {
    if (contentType === 'build') return '';
    if (contentType === 'achievement') return '';
    if (isPassType) return id ? `/${id}` : '';
    const path =
      contentType === 'user'
        ? username
        : contentType === 'mission'
        ? rootMissionType || missionType
        : id;
    return path ? `/${path}` : '';
  }, [contentType, id, isPassType, missionType, rootMissionType, username]);

  const appliedLabel = useMemo(() => {
    if (contentType === 'build') {
      return label || getBuildDisplayTitle(contentObj || {});
    }
    return !label && contentType === 'user'
      ? username
      : label || title || word || content || truncatedTopic;
  }, [
    content,
    contentObj,
    contentType,
    label,
    title,
    truncatedTopic,
    username,
    word
  ]);

  return appliedLabel ? (
    <Link
      style={{
        fontWeight: 'bold',
        color: byUser ? userLinkColor : linkColor,
        ...style
      }}
      to={contentType === 'build' ? buildPath : `/${rootPath}${subPath}`}
    >
      {removeLineBreaks(appliedLabel)}
    </Link>
  ) : (
    <span style={{ fontWeight: 'bold', color: Color.darkerGray() }}>
      (Deleted)
    </span>
  );
}
