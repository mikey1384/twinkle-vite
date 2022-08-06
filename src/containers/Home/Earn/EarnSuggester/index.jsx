import PropTypes from 'prop-types';
import { panel } from '../Styles';
import EarnXPFromSubjects from './EarnXPFromSubjects';

EarnSuggester.propTypes = {
  style: PropTypes.object
};

export default function EarnSuggester({ style }) {
  return (
    <div style={style} className={panel}>
      <EarnXPFromSubjects />
    </div>
  );
}
