import PropTypes from 'prop-types';
import UsernameText from '~/components/Texts/UsernameText';
import { Color } from '~/constants/css';

Heading.propTypes = {
  isTrade: PropTypes.bool.isRequired,
  from: PropTypes.object.isRequired,
  myId: PropTypes.number.isRequired,
  isWantingCoin: PropTypes.bool
};

export default function Heading({ isTrade, from, myId, isWantingCoin }) {
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        padding: '2rem',
        fontSize: '2rem',
        fontFamily: 'Roboto, monospace',
        fontWeight: 'bold',
        backgroundColor: Color.lightGray(),
        color: '#fff',
        marginBottom: '1.5rem'
      }}
    >
      <div>
        <UsernameText
          displayedName={from.id === myId ? 'You' : from.username}
          color="#fff"
          user={{
            id: from.id,
            username: from.username
          }}
        />{' '}
        {isTrade
          ? `want${from.id === myId ? '' : 's'} to trade`
          : isWantingCoin
          ? `want${from.id === myId ? '' : 's'}`
          : `${from.id === myId ? 'are' : 'is'} interested in`}
      </div>
    </div>
  );
}
