import React, { useEffect, useRef } from 'react';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { scrollElementToCenter } from '~/helpers';
import { useSpring, animated } from 'react-spring';
import { css } from '@emotion/css';
import { QRCodeSVG } from 'qrcode.react';

export default function SectionToScreenshot({
  code,
  onSetButtonShown
}: {
  code: string;
  onSetButtonShown: (value: boolean) => void;
}) {
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

  const AnimatedDiv = animated('div');
  return (
    <AnimatedDiv
      ref={SectionRef}
      className={css`
        border: 1px solid var(--ui-border);
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
        width: 'auto',
        alignItems: 'center',
        justifyContent: 'center',
        ...styles
      }}
      >
        <div style={{ fontFamily: 'Verdana, Ariel, Tahoma' }}>
          <QRCodeSVG value={code} />
        </div>
    </AnimatedDiv>
  );
}
