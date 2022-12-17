import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import { Color } from '~/constants/css';

ListedMenu.propTypes = {
  askPrice: PropTypes.number.isRequired,
  userIsOwner: PropTypes.bool.isRequired
};

export default function ListedMenu({ userIsOwner, askPrice }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column'
      }}
    >
      <div
        style={{
          height: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}
      >
        <div style={{ marginBottom: '2rem' }}>
          {userIsOwner ? (
            'Cancel Listing'
          ) : (
            <div style={{ textAlign: 'center' }}>
              Buy this card for
              <div
                style={{
                  marginTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Icon
                  style={{ color: Color.brownOrange() }}
                  icon={['far', 'badge-dollar']}
                />
                <span
                  style={{
                    marginLeft: '0.2rem',
                    color: Color.darkerGray(),
                    fontWeight: 'bold'
                  }}
                >
                  {askPrice}
                </span>
              </div>
            </div>
          )}
        </div>
        <Button
          onClick={() => console.log('clicked')}
          color="oceanBlue"
          filled
          style={{ border: 'none' }}
        >
          <Icon icon="shopping-cart" />
          <span style={{ marginLeft: '0.7rem' }}>
            {userIsOwner ? 'Cancel Listing' : 'Buy'}
          </span>
        </Button>
      </div>
    </div>
  );
}
