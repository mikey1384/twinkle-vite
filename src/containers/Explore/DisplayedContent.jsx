import PropTypes from 'prop-types';
import Videos from './Videos';
import Links from './Links';
import Subjects from './Subjects';

DisplayedContent.propTypes = {
  category: PropTypes.string.isRequired
};

export default function DisplayedContent({ category }) {
  if (category === 'videos') {
    return <Videos />;
  }
  if (category === 'links') {
    return <Links />;
  }
  if (category === 'subjects') {
    return <Subjects />;
  }
  return null;
}
