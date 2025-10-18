import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Link } from 'react-router-dom';
import { Subject } from '~/types';
import ScopedTheme from '~/theme/ScopedTheme';
import { useRoleColor } from '~/theme/useRoleColor';

export default function SubjectLink({
  subject,
  theme
}: {
  subject: Subject;
  theme?: string;
}) {
  const { color: contentColor, themeName } = useRoleColor('content', {
    themeName: theme,
    fallback: 'logoBlue'
  });
  const contentColorVar = `var(--role-content-color, ${contentColor})`;

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
