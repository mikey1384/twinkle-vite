import { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import localize from '~/constants/localize';
import ChangePasswordModal from './ChangePasswordModal';

const changeMyPasswordLabel = localize('changeMyPassword');

ChangePassword.propTypes = {
  style: PropTypes.object
};

export default function ChangePassword({ style }) {
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
