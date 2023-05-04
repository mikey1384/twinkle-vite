import React from 'react';
import PropTypes from 'prop-types';
import PassContent from '../PassContent';
import { Content, User } from '~/types';

PassNotification.propTypes = {
  contentType: PropTypes.string.isRequired,
  theme: PropTypes.string.isRequired,
  uploader: PropTypes.object.isRequired,
  rootObj: PropTypes.object.isRequired
};
export default function PassNotification({
  contentType,
  theme,
  uploader,
  rootObj
}: {
  contentType: string;
  theme: string;
  uploader: User;
  rootObj: Content;
}) {
  if (contentType !== 'pass') return null;
  return <PassContent theme={theme} uploader={uploader} rootObj={rootObj} />;
}
