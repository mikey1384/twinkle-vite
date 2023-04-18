import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Link } from 'react-router-dom';
import { Color } from '~/constants/css';
import { useTheme } from '~/helpers/hooks';
import { useKeyContext } from '~/contexts';

export default function SubjectLink({
  subject,
  theme
}: {
  subject: any;
  theme?: any;
}) {
  const { profileTheme } = useKeyContext((v) => v.myState);
  const {
    content: { color: contentColor }
  } = useTheme(theme || profileTheme);

  return (
    <ErrorBoundary componentPath="Comments/SubjectLink">
      <Link
        style={{
          fontWeight: 'bold',
          color: Color[contentColor]()
        }}
        to={`/subjects/${subject.id}`}
      >
        {subject.title}
      </Link>
    </ErrorBoundary>
  );
}
