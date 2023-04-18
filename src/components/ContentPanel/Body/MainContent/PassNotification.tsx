import React from 'react';
import PassContent from '../PassContent';

export default function PassNotification({
  contentType,
  theme,
  uploader,
  rootObj
}: {
  contentType: string;
  theme: string;
  uploader: any;
  rootObj: any;
}) {
  if (contentType !== 'pass') return null;
  return <PassContent theme={theme} uploader={uploader} rootObj={rootObj} />;
}
