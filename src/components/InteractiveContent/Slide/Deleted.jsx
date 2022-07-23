import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { isMobile } from '~/helpers';

Deleted.propTypes = {
  onRemoveInteractiveSlide: PropTypes.func.isRequired,
  onUndeleteSlide: PropTypes.func.isRequired
};

const deviceIsMobile = isMobile(navigator);

export default function Deleted({ onRemoveInteractiveSlide, onUndeleteSlide }) {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '-1rem'
      }}
    >
      <div
        className={css`
          font-size: 1.7rem;
          font-weight: bold;
          display: flex;
          flex-grow: 1;
          justify-content: center;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.5rem;
          }
        `}
      >
        This slide has been deleted
      </div>
      <div style={{ display: 'flex', marginLeft: '1rem' }}>
        <Button
          style={{ fontSize: '1.3rem' }}
          skeuomorphic
          onClick={onUndeleteSlide}
        >
          <Icon icon="trash-restore" />
          <span style={{ marginLeft: '1rem' }}>Undo</span>
        </Button>
        <Button
          style={{ marginLeft: '1rem', fontSize: '1.3rem' }}
          skeuomorphic
          onClick={onRemoveInteractiveSlide}
        >
          <Icon icon="minus" />
          <span style={{ marginLeft: '1rem' }}>
            Hide{deviceIsMobile ? '' : ' this message'}
          </span>
        </Button>
      </div>
    </div>
  );
}
