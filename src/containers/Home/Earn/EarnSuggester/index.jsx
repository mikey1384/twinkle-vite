import PropTypes from 'prop-types';
import { panel } from '../Styles';
import { useHomeContext } from '~/contexts';
import EarnXPFromSubjects from './EarnXPFromSubjects';
import StartMenu from './StartMenu';

EarnSuggester.propTypes = {
  style: PropTypes.object
};

export default function EarnSuggester({ style }) {
  const earnSection = useHomeContext((v) => v.state.earnSection);

  return (
    <div style={style} className={panel}>
      {earnSection === 'start' ? <StartMenu /> : <EarnXPFromSubjects />}
    </div>
  );
}
