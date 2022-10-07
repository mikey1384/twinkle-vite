import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { css } from '@emotion/css';

Prompt.propTypes = {
  children: PropTypes.node.isRequired
};

export default function Prompt({ children }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setTimeout(() => setShow(true), 100);
  }, []);

  return (
    <div
      className={css`
        > p {
          opacity: 0;
          &.shown {
            opacity: 1;
          }
          transition: opacity 1s;
        }
      `}
      style={{ fontSize: '1.7rem' }}
    >
      <p className={show ? 'shown' : ''}>{children}</p>
    </div>
  );
}
