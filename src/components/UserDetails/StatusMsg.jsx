import PropTypes from 'prop-types';
import LongText from '~/components/Texts/LongText';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';

StatusMsg.propTypes = {
  statusColor: PropTypes.string,
  statusMsg: PropTypes.string.isRequired,
  style: PropTypes.object
};

export default function StatusMsg({
  statusColor = 'logoBlue',
  statusMsg,
  style
}) {
  return (
    <div
      className={css`
        background: ${Color[statusColor]?.() || Color.logoBlue()};
        color: ${statusColor === 'ivory' ? Color.black() : '#fff'};
        font-size: 1.7rem;
        padding: 1rem;
        margin-top: 1rem;
        box-shadow: 0 5px 5px ${Color.lighterGray()};
        overflow-wrap: break-word;
        word-break: break-word;
      `}
      style={style}
    >
      <LongText
        isStatusMsg
        theme={statusColor}
        readMoreColor={statusColor === 'ivory' ? 'black' : '#fff'}
      >
        {statusMsg}
      </LongText>
    </div>
  );
}
