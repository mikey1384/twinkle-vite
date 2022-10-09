import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import { Color } from '~/constants/css';
import { applyTextEffects } from '~/helpers/stringHelpers';

StatusMessage.propTypes = {
  failMessage: PropTypes.string,
  passMessage: PropTypes.string,
  status: PropTypes.string,
  onBackToStart: PropTypes.func,
  isComplete: PropTypes.bool
};

export default function StatusMessage({
  status,
  passMessage,
  failMessage,
  onBackToStart,
  isComplete
}) {
  return (
    <div
      style={{
        borderTop: `1px solid ${Color.borderGray()}`,
        borderBottom: `1px solid ${Color.borderGray()}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '2rem',
        marginLeft: '-1rem',
        marginRight: '-1rem',
        marginBottom: '-1rem',
        fontSize: '1.5rem',
        minHeight: '5rem',
        padding: '1.5rem 0'
      }}
    >
      {isComplete ? (
        <div>
          <div
            style={{
              marginTop: '1.5rem',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <Button onClick={onBackToStart} skeuomorphic color="logoBlue">
              Back to Start Screen
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ marginLeft: '2rem' }}>
          <div
            style={{
              display: 'flex',
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Icon
              size="2x"
              style={{
                color: status === 'pass' ? Color.green() : Color.rose()
              }}
              icon={status === 'pass' ? 'check' : 'times'}
            />
            <span
              style={{ marginLeft: '1.5rem', fontSize: '1.7rem' }}
              dangerouslySetInnerHTML={{
                __html: applyTextEffects(
                  status === 'pass' ? passMessage : failMessage
                )
              }}
            />
          </div>
          {status === 'fail' && (
            <div
              style={{
                marginTop: '1.5rem',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <Button onClick={onBackToStart} skeuomorphic color="rose">
                Back to Start Screen
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
