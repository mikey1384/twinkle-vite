import React from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import { useKeyContext } from '~/contexts';

NoPictures.propTypes = {
  numPics: PropTypes.number.isRequired,
  onAddButtonClick: PropTypes.func.isRequired,
  profileId: PropTypes.number.isRequired
};

export default function NoPictures({
  numPics,
  onAddButtonClick,
  profileId
}: {
  numPics: number;
  onAddButtonClick: () => void;
  profileId: number;
}) {
  const userId = useKeyContext((v) => v.myState.userId);

  return (
    <ErrorBoundary componentPath="Profile/Body/Home/Pictures/NoPictures/index">
      {profileId === userId && numPics > 0 ? (
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            lineHeight: 2,
            marginTop: '2rem',
            marginBottom: '2rem'
          }}
        >
          <Button
            onClick={onAddButtonClick}
            transparent
            style={{ fontSize: '2rem' }}
          >
            <Icon icon="plus" />
            <span style={{ marginLeft: '0.7rem' }}>Add Pictures</span>
          </Button>
        </div>
      ) : null}
    </ErrorBoundary>
  );
}
