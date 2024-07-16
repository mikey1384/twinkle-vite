import React, { useState } from 'react';
import Button from '~/components/Button';
import localize from '~/constants/localize';
import ChangePasswordModal from './ChangePasswordModal';

const changeMyPasswordLabel = localize('changeMyPassword');

export default function ChangePassword({
  style
}: {
  style?: React.CSSProperties;
}) {
  const [changePasswordModalShown, setChangePasswordModalShown] =
    useState(false);
  return (
    <div style={style}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Button
          onClick={() => setChangePasswordModalShown(true)}
          color="logoBlue"
          filled
        >
          {changeMyPasswordLabel}
        </Button>
      </div>
      {changePasswordModalShown && (
        <ChangePasswordModal
          onHide={() => setChangePasswordModalShown(false)}
        />
      )}
    </div>
  );
}
