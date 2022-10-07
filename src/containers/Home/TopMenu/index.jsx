import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import { panel } from './Styles';
import { useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

TopMenu.propTypes = {
  children: PropTypes.node
};

export default function TopMenu({ children = null }) {
  const { username } = useKeyContext((v) => v.myState);
  return username ? (
    <ErrorBoundary componentPath="Home/Stories/TopMenu">
      <div style={{ marginBottom: '1rem' }} className={panel}>
        <p
          className={css`
            color: ${Color.darkerGray()};
            font-size: 2rem;
          `}
        >
          Hi, {username}! What do you want to do today?
        </p>
        {children}
        <div style={{ marginTop: '1rem', display: 'flex' }}>
          <div className={panel}>Post something</div>
          <div style={{ marginLeft: '1rem' }} className={panel}>
            Play Grammar Game
          </div>
          <div style={{ marginLeft: '1rem' }} className={panel}>
            Earn Karma Points
          </div>
        </div>
      </div>
    </ErrorBoundary>
  ) : null;
}
