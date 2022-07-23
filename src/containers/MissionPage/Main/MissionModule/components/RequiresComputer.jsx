import PropTypes from 'prop-types';
import { isMobile } from '~/helpers';

RequiresComputer.propTypes = {
  children: PropTypes.node
};

const deviceIsMobile = isMobile(navigator);

export default function RequiresComputer({ children, ...props }) {
  if (deviceIsMobile) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: '100%',
          height: '7rem',
          fontSize: '1.7rem',
          fontWeight: 'bold',
          alignItems: 'center',
          lineHeight: 2
        }}
      >
        <p>Sorry, you need to use a computer for this step.</p>
        <p>Come back when you are using a computer.</p>
      </div>
    );
  }

  return { ...children, props: { ...children.props, ...props } };
}
