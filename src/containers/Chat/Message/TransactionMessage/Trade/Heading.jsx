import PropTypes from 'prop-types';
import UsernameText from '~/components/Texts/UsernameText';
import { Color } from '~/constants/css';

Heading.propTypes = {
  isTrade: PropTypes.bool.isRequired,
  from: PropTypes.object.isRequired,
  myId: PropTypes.number.isRequired
};

export default function Heading({ isTrade, from, myId }) {
  return (
    <div>
      <UsernameText
        displayedName={from.id === myId ? 'You' : from.username}
        color={Color.black()}
        user={{
          id: from.id,
          username: from.username
        }}
      />{' '}
      {isTrade ? 'wants to trade' : 'is interested in'}
      <div></div>
    </div>
  );
}
