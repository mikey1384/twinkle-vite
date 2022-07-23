import PropTypes from 'prop-types';
import StepSlide from '../../components/StepSlide';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

CreateNewRepl.propTypes = {
  index: PropTypes.number,
  innerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  okayPressed: PropTypes.bool
};

export default function CreateNewRepl({ index, innerRef, okayPressed }) {
  return (
    <StepSlide
      innerRef={innerRef}
      index={index}
      title={
        <>
          Create a <span style={{ color: Color.orange() }}>Next.js Repl</span>{' '}
          after reading the{' '}
          <span style={{ color: Color.orange() }}>tutorial</span>
          <p style={{ color: Color.cranberry() }}>
            Make sure you read the tutorial for this step. Otherwise, you will
            get stuck later
          </p>
        </>
      }
    >
      {okayPressed && (
        <h1
          className={css`
            margin-top: 4.5rem;
            margin-bottom: 3.5rem;
          `}
        >
          Did you create a{' '}
          <span style={{ color: Color.orange() }}>Next.js</span> Repl?
        </h1>
      )}
    </StepSlide>
  );
}
