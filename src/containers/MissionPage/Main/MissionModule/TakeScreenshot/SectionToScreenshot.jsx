import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { scrollElementToCenter } from '~/helpers';
import { useSpring, animated } from 'react-spring';
import { css } from '@emotion/css';

SectionToScreenshot.propTypes = {
  onSetButtonShown: PropTypes.func.isRequired,
  username: PropTypes.string
};

export default function SectionToScreenshot({ username, onSetButtonShown }) {
  const styles = useSpring({
    to: { marginLeft: '0' },
    from: { marginLeft: '-100%' }
  });
  const SectionRef = useRef(null);
  useEffect(() => {
    setTimeout(() => scrollElementToCenter(SectionRef.current), 0);
    setTimeout(() => {
      onSetButtonShown(true);
    }, 3200);
  }, [onSetButtonShown]);

  return (
    <animated.div
      ref={SectionRef}
      className={css`
        border: 1px solid ${Color.borderGray()};
        border-radius: ${borderRadius};
        text-align: center;
        padding: 1rem;
        background: ${Color.ivory()};
        font-size: 1.7rem;
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.3rem;
        }
      `}
      style={{
        display: 'flex',
        width: '75%',
        flexDirection: 'column',
        alignItems: 'center',
        ...styles
      }}
    >
      <p
        className={css`
          font-weight: bold;
          font-size: 3rem;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 2.5rem;
          }
        `}
      >
        Screenshot this box
      </p>
      <p style={{ marginTop: '1.5rem' }}>
        <b>{username}</b> captured this screenshot on {returnNow()}
      </p>
    </animated.div>
  );

  function returnNow() {
    const now = new Date(Date.now());
    return now.toString();
  }
}
