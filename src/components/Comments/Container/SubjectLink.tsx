import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Link } from 'react-router-dom';
import { Color } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import { Subject } from '~/types';
import ScopedTheme from '~/theme/ScopedTheme';
import { getThemeRoles, ThemeName } from '~/theme/themes';

export default function SubjectLink({
  subject,
  theme
}: {
  subject: Subject;
  theme?: string;
}) {
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const themeName = useMemo<ThemeName>(
    () => ((theme || profileTheme || 'logoBlue') as ThemeName),
    [profileTheme, theme]
  );
  const contentColorVar = useMemo(() => {
    const role = getThemeRoles(themeName).content;
    const colorKey = role?.color || 'logoBlue';
    const opacity = role?.opacity ?? 1;
    const colorFn = Color[colorKey as keyof typeof Color];
    const fallback = colorFn ? colorFn(opacity) : colorKey;
    return `var(--role-content-color, ${fallback})`;
  }, [themeName]);

  return (
    <ErrorBoundary componentPath="Comments/SubjectLink">
      <ScopedTheme theme={themeName} roles={['content']}>
        <Link
          style={{
            fontWeight: 'bold',
            color: contentColorVar
          }}
          to={`/subjects/${subject.id}`}
        >
          {subject.title}
        </Link>
      </ScopedTheme>
    </ErrorBoundary>
  );
}
