import PropTypes from 'prop-types';
import Spinner from '~/components/Spinner';
import { css } from '@emotion/css';

Loading.propTypes = {
  className: PropTypes.string,
  innerStyle: PropTypes.object,
  style: PropTypes.object,
  text: PropTypes.string,
  theme: PropTypes.string
};

export default function Loading({
  className,
  text = '',
  innerStyle = {},
  style = {},
  theme
}) {
  return (
    <div
      className={
        className ||
        css`
          height: 15rem;
          width: 100%;
        `
      }
      style={{ zIndex: 1_000_000_000, ...style }}
    >
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '2.8rem',
          ...innerStyle
        }}
      >
        <Spinner theme={theme} />
        {text && <div style={{ marginLeft: '1.5rem' }}>{text}</div>}
      </div>
    </div>
  );
}
