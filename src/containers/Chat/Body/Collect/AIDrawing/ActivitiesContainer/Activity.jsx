import PropTypes from 'prop-types';
import { cloudFrontURL } from '~/constants/defaultValues';
import Card from './Card';

Activity.propTypes = {
  activity: PropTypes.object.isRequired
};

export default function Activity({ activity }) {
  return (
    <div
      style={{
        width: '100%',
        padding: '1rem',
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column'
      }}
    >
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Card frontPicUrl={`${cloudFrontURL}${activity.images[0]}`} />
      </div>
      <div style={{ padding: '1rem' }}>
        <div>{activity.prompt}</div>
      </div>
    </div>
  );
}
