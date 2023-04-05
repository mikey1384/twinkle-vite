import PassContent from '../PassContent';
import PropTypes from 'prop-types';

PassNotification.propTypes = {
  contentType: PropTypes.string,
  theme: PropTypes.string,
  uploader: PropTypes.object,
  rootObj: PropTypes.object
};

export default function PassNotification({
  contentType,
  theme,
  uploader,
  rootObj
}) {
  if (contentType !== 'pass') return null;
  return <PassContent theme={theme} uploader={uploader} rootObj={rootObj} />;
}
