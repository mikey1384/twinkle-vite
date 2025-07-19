import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Link } from 'react-router-dom';
import { Color } from '~/constants/css';
import { returnTheme } from '~/helpers';
import { useKeyContext } from '~/contexts';
import { Subject } from '~/types';

SubjectLink.propTypes = {
  subject: PropTypes.object.isRequired,
  theme: PropTypes.string
};
export default function SubjectLink({
  subject,
  theme
}: {
  subject: Subject;
  theme?: string;
}) {
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const {
    content: { color: contentColor }
  } = useMemo(() => returnTheme(theme || profileTheme), [profileTheme, theme]);

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
