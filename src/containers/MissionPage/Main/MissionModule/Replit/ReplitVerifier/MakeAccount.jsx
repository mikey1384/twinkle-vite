import PropTypes from 'prop-types';
import StepSlide from '../../components/StepSlide';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

MakeAccount.propTypes = {
  index: PropTypes.number,
  okayPressed: PropTypes.bool,
  onSetOkayPressed: PropTypes.func.isRequired
};

export default function MakeAccount({ index, okayPressed, onSetOkayPressed }) {
  return (
    <StepSlide
      index={index}
      title={
        <>
          Create a Replit account from{' '}
          <a
            onClick={() => onSetOkayPressed(true)}
            href="https://replit.com"
            target="_blank"
            rel="noreferrer"
          >
            https://replit.com
          </a>{' '}
          using the <b style={{ color: Color.orange() }}>GitHub</b> button
        </>
      }
    >
      {' '}
      {okayPressed && (
        <h1
          className={css`
            margin-top: 4.5rem;
            margin-bottom: 3.5rem;
          `}
        >
          Did you make an account?
        </h1>
      )}
    </StepSlide>
  );
}
