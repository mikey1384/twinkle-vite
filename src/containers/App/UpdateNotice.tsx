import React from 'react';
import UpdateRecoveryNotice from '~/components/UpdateRecoveryNotice';
import { performClientUpdateReload } from '~/helpers/clientUpdate';

export default function UpdateNotice({
  updateDetail
}: {
  updateDetail: string;
}) {
  return (
    <UpdateRecoveryNotice
      buttonLabel="Update Now"
      detail={updateDetail || 'Please press the button below to update.'}
      message="To ensure all features work properly, you must update to the latest version."
      onAction={performClientUpdateReload}
      title="Important Update Required"
    />
  );
}
