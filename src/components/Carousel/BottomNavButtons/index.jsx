import React from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import ConditionalButton from './ConditionalButton';
import localize from '~/constants/localize';

const finishLabel = localize('finish');
const nextLabel = localize('next');
const prevLabel = localize('prev');

BottomNavButtons.propTypes = {
  conditionPassStatus: PropTypes.string,
  currentSlide: PropTypes.number.isRequired,
  nextButtonDisabled: PropTypes.bool,
  onPrev: PropTypes.func,
  onNext: PropTypes.func.isRequired,
  onFinish: PropTypes.func,
  slideCount: PropTypes.number.isRequired,
  onCheckNavCondition: PropTypes.func
};
export default function BottomNavButtons({
  currentSlide,
  nextButtonDisabled,
  onPrev,
  onNext,
  onFinish,
  slideCount,
  onCheckNavCondition,
  conditionPassStatus
}) {
  return conditionPassStatus && conditionPassStatus === 'complete' ? null : (
    <div
      style={{
        display: 'flex',
        marginTop: '0.5rem',
        justifyContent: 'flex-end',
        width: '100%'
      }}
    >
      {onCheckNavCondition ? (
        <ConditionalButton
          nextButtonDisabled={nextButtonDisabled}
          conditionPassStatus={conditionPassStatus}
          onCheckNavCondition={() => onCheckNavCondition(onNext)}
        />
      ) : (
        <>
          <Button
            style={{ marginRight: '0.5rem', fontSize: '1.7rem' }}
            onClick={onPrev}
            transparent
            disabled={currentSlide === 0}
          >
            {prevLabel}
          </Button>
          <Button
            filled
            disabled={nextButtonDisabled}
            style={{ fontSize: '1.7rem' }}
            onClick={currentSlide + 1 === slideCount ? onFinish : onNext}
            color={currentSlide + 1 === slideCount ? 'brownOrange' : 'green'}
          >
            {currentSlide + 1 === slideCount ? finishLabel : nextLabel}
          </Button>
        </>
      )}
    </div>
  );
}
