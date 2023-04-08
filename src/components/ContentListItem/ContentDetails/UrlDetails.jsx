import PropTypes from 'prop-types';
import Embedly from '~/components/Embedly';

UrlDetails.propTypes = {
  contentId: PropTypes.number.isRequired,
  title: PropTypes.string
};

export default function UrlDetails({ contentId, title }) {
  return (
    <div>
      <span
        style={{
          fontWeight: 'bold',
          fontSize: '2rem'
        }}
        className="label"
      >
        {title}
      </span>
      <Embedly
        small
        noLink
        style={{ marginTop: '0.5rem' }}
        contentId={contentId}
      />
    </div>
  );
}
