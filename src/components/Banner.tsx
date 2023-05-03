import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { useKeyContext } from '~/contexts';

Banner.propTypes = {
  children: PropTypes.node.isRequired,
  color: PropTypes.string,
  innerRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any })
  ]),
  loading: PropTypes.bool,
  onClick: PropTypes.func,
  spinnerDelay: PropTypes.number,
  style: PropTypes.object
};
export default function Banner({
  children,
  color,
  innerRef,
  loading,
  onClick,
  spinnerDelay = 1000,
  style = {}
}: {
  children: React.ReactNode;
  color?: string;
  innerRef?: React.RefObject<any>;
  loading?: boolean;
  onClick?: () => void;
  spinnerDelay?: number;
  style?: React.CSSProperties;
}) {
  const {
    warning: { color: warningColor }
  } = useKeyContext((v) => v.theme);
  const timerRef: React.MutableRefObject<any> = useRef(null);
  const [spinnerShown, setSpinnerShown] = useState(false);

  useEffect(() => {
    if (loading) {
      timerRef.current = setTimeout(() => {
        setSpinnerShown(true);
      }, spinnerDelay);
    } else {
      clearTimeout(timerRef.current);
      setSpinnerShown(false);
    }
  }, [loading, spinnerDelay]);

  return (
    <div
      ref={innerRef}
      className={css`
        opacity: ${loading ? 0.5 : 1};
        width: 100%;
        background: ${Color[color || warningColor]()};
        color: #fff;
        padding: 1.5rem;
        text-align: center;
        font-size: 2rem;
        justify-content: center;
        &:hover {
          ${onClick && !loading ? 'opacity: 0.8;' : ''};
        }
      `}
      style={{
        ...style,
        cursor: onClick && !loading ? 'pointer' : 'default'
      }}
      onClick={loading || !onClick ? () => null : onClick}
    >
      {children}
      {loading && spinnerShown && (
        <Icon style={{ marginLeft: '1rem' }} icon="spinner" pulse />
      )}
    </div>
  );
}
