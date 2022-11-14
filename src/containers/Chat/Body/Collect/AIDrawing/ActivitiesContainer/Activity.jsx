import PropTypes from 'prop-types';
import { cloudFrontURL } from '~/constants/defaultValues';

Activity.propTypes = {
  activity: PropTypes.object.isRequired
};

export default function Activity({ activity }) {
  return (
    <div>
      <img
        style={{ width: '70%' }}
        src={`${cloudFrontURL}${activity.images[0]}`}
      />
      <div>{activity.prompt}</div>
    </div>
  );
}
