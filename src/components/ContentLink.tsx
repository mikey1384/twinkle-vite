import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Color } from '~/constants/css';
import { removeLineBreaks, truncateTopic } from '~/helpers/stringHelpers';
import { useKeyContext } from '~/contexts';
import { getThemeRoles, ThemeName } from '~/theme/themes';

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
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const themeName = useMemo<ThemeName>(
    () => ((theme || profileTheme || 'logoBlue') as ThemeName),
    [profileTheme, theme]
  );
  const themeRoles = useMemo(() => getThemeRoles(themeName), [themeName]);
  const userLinkColor = useMemo(() => {
    const role = themeRoles.userLink;
    const key = role?.color || 'logoBlue';
    const opacity = role?.opacity;
    const fn = Color[key as keyof typeof Color];
    return fn
      ? typeof opacity === 'number'
        ? fn(opacity)
        : fn()
      : key;
  }, [themeRoles]);
  const linkColor = useMemo(() => {
    const role = themeRoles.link;
    const key = role?.color || 'logoBlue';
    const opacity = role?.opacity;
    const fn = Color[key as keyof typeof Color];
    return fn
      ? typeof opacity === 'number'
        ? fn(opacity)
        : fn()
      : key;
  }, [themeRoles]);
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
