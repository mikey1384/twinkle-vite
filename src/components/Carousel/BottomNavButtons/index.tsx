import React from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import ConditionalButton from './ConditionalButton';
import localize from '~/constants/localize';

const finishLabel = localize('finish');
const nextLabel = localize('next');
const prevLabel = localize('prev');

BottomNavButtons.propTypes = {
  currentSlide: PropTypes.number.isRequired,
  nextButtonDisabled: PropTypes.bool,
  onPrev: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onFinish: PropTypes.func,
  slideCount: PropTypes.number.isRequired,
  onCheckNavCondition: PropTypes.func,
  conditionPassStatus: PropTypes.string
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
}: {
  currentSlide: number;
  nextButtonDisabled?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onFinish?: () => void;
  slideCount: number;
  onCheckNavCondition?: (onNext: () => void) => void;
  conditionPassStatus?: string;
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
