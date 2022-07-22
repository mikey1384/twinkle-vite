import React from 'react';
import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';

GoBack.propTypes = {
  isAtTop: PropTypes.bool,
  bordered: PropTypes.bool,
  to: PropTypes.string,
  isMobile: PropTypes.bool,
  style: PropTypes.object,
  text: PropTypes.string
};

export default function GoBack({
  isAtTop = true,
  bordered,
  isMobile,
  to,
  style,
  text
}) {
  const navigate = useNavigate();
  return (
    <div
      style={style}
      className={`${isMobile ? 'mobile ' : ''}${css`
        background: #fff;
        font-size: 2rem;
        font-weight: bold;
        cursor: pointer;
        width: 100%;
        height: 100%;
        display: flex;
        padding: 1rem 1rem 1rem 1rem;
        align-items: center;
        transition: background 0.4s;
        line-height: 1.7;
        ${bordered
          ? `border: 1px solid ${Color.borderGray()}; border-radius: ${borderRadius};`
          : ''}
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.7rem;
          ${isAtTop ? `` : 'padding-top: 1.5rem;'}
          padding-bottom: 1.5rem;
          border-radius: 0;
          ${isAtTop ? `border-top: 0;` : ''}
          border-left: 0;
          border-right: 0;
          &:hover {
            background: #fff;
            color: #000;
          }
        }
      `}`}
      onClick={() => (to ? navigate(to) : navigate(-1))}
    >
      <span>
        <Icon icon="arrow-left" /> {text || 'Go Back'}
      </span>
    </div>
  );
}
