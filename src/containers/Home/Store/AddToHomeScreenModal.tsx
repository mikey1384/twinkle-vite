import React from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

const steps = [
  'Open Twinkle in Safari.',
  'Tap the Share button (the square with an arrow pointing up).',
  'Scroll down and tap "Add to Home Screen", then tap "Add".',
  'Open Twinkle from your Home Screen and turn this switch on.'
];

export default function AddToHomeScreenModal({
  onHide
}: {
  onHide: () => void;
}) {
  return (
    <Modal
      modalKey="AddToHomeScreenModal"
      isOpen
      size="md"
      title="Add Twinkle to your Home Screen"
      onClose={onHide}
      footer={
        <Button color="logoBlue" variant="solid" onClick={onHide}>
          Got it
        </Button>
      }
    >
      <div
        className={css`
          font-size: 1.4rem;
          line-height: 1.7;
          color: ${Color.darkerGray()};
        `}
      >
        <p>
          <Icon icon="bell" style={{ marginRight: '0.7rem' }} />
          On iPhones and iPads, notifications only work for websites that have
          been added to the Home Screen. It only takes a few seconds:
        </p>
        <ol
          className={css`
            margin-top: 1.5rem;
            padding-left: 2.2rem;
            li {
              margin-bottom: 0.7rem;
            }
          `}
        >
          {steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </div>
    </Modal>
  );
}
