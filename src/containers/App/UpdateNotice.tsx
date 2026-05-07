import React from 'react';
import UpdateRecoveryNotice from '~/components/UpdateRecoveryNotice';

const UPDATE_RELOAD_PARAM = '_twinkleUpdate';

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
      onAction={handleUpdateNow}
      title="Important Update Required"
    />
  );
}

function handleUpdateNow() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set(UPDATE_RELOAD_PARAM, String(Date.now()));
    window.location.replace(url.toString());
  } catch {
    window.location.reload();
  }
}
