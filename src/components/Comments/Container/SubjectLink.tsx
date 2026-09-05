import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Link } from 'react-router-dom';
import { Subject } from '~/types';
import ScopedTheme from '~/theme/ScopedTheme';
import { useRoleColor } from '~/theme/hooks/useRoleColor';

export default function SubjectLink({
  subject,
  theme
}: {
  subject?: Partial<Subject> | null;
  theme?: string;
}) {
  const { color: contentColor, themeName } = useRoleColor('content', {
    themeName: theme,
    fallback: 'logoBlue'
  });
  const contentColorVar = `var(--role-content-color, ${contentColor})`;

  // Comments on Builds and other non-Subject roots have no target Subject.
  // Their callers may supply an empty fallback object, which is truthy but
  // must never become an empty /subjects/undefined navigation target.
  if (!Number.isSafeInteger(subject?.id) || Number(subject?.id) <= 0) {
    return null;
  }

  return (
    <ErrorBoundary componentPath="Comments/SubjectLink">
      <ScopedTheme theme={themeName} roles={['content']}>
        <Link
          style={{
            fontWeight: 'bold',
            color: contentColorVar
          }}
          to={`/subjects/${subject?.id}`}
        >
          {subject?.title}
        </Link>
      </ScopedTheme>
    </ErrorBoundary>
  );
}
