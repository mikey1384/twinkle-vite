import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { borderRadius, Color } from '~/constants/css';
import { scrollElementToCenter } from '~/helpers';

SuccessMessage.propTypes = {
  onNextClick: PropTypes.func.isRequired
};

export default function SuccessMessage({ onNextClick }) {
  const ComponentRef = useRef(null);
  useEffect(() => {
    scrollElementToCenter(ComponentRef.current);
  }, []);

  return (
    <div
      ref={ComponentRef}
      style={{
        marginTop: '1rem',
        padding: '1rem',
        border: `1px solid ${Color.darkBlue()}`,
        borderRadius,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#fff',
        background: Color.darkBlue(0.6),
        fontSize: '1.7rem',
        fontWeight: 'bold'
      }}
    >
      <div>
        You did it! Tap <b style={{ color: Color.gold() }}>Next</b> to continue
        <Icon
          icon="arrow-right"
          style={{ color: Color.gold(), marginLeft: '1rem' }}
        />
      </div>
      <Button onClick={onNextClick} color="gold" filled>
        Next
      </Button>
    </div>
  );
}
