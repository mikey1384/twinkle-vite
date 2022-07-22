import React from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Link } from 'react-router-dom';
import { Color } from '~/constants/css';
import { useTheme } from '~/helpers/hooks';
import { useKeyContext } from '~/contexts';

SubjectLink.propTypes = {
  subject: PropTypes.object.isRequired,
  theme: PropTypes.string
};

export default function SubjectLink({ subject, theme }) {
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
