import PropTypes from 'prop-types';
import { css } from '@emotion/css';
import { borderRadius, innerBorderRadius, Color } from '~/constants/css';
import Icon from '~/components/Icon';

CheckListGroup.propTypes = {
  inputType: PropTypes.string,
  listItems: PropTypes.arrayOf(
    PropTypes.shape({
      checked: PropTypes.bool.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  style: PropTypes.object
};

export default function CheckListGroup({
  listItems,
  inputType = 'checkbox',
  onSelect,
  style = {}
}) {
  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        width: 100%;
        nav {
          border: 1px solid ${Color.borderGray()};
          border-top: none;
        }
        nav:first-of-type {
          border: 1px solid ${Color.borderGray()};
          border-top-left-radius: ${borderRadius};
          border-top-right-radius: ${borderRadius};
          section {
            border-top-left-radius: ${innerBorderRadius};
          }
        }
        nav:last-child {
          border-bottom-left-radius: ${borderRadius};
          border-bottom-right-radius: ${borderRadius};
          section {
            border-bottom-left-radius: ${innerBorderRadius};
          }
        }
      `}
      style={style}
    >
      {listItems.map((listItem, index) => {
        return (
          <nav
            className={css`
              min-height: 4.3rem;
              display: flex;
              align-items: stretch;
              width: 100%;
              cursor: pointer;
              &:hover {
                background: ${Color.highlightGray()};
              }
            `}
            onClick={() => onSelect(index)}
            key={index}
          >
            <section
              className={css`
                width: 4.3rem;
                background: ${Color.checkboxAreaGray()};
                display: flex;
                align-items: center;
                justify-content: center;
              `}
            >
              <input
                type={inputType}
                checked={listItem.checked}
                onChange={() => onSelect(index)}
              />
            </section>
            <div
              style={{
                width: 'CALC(100% - 4.3rem)',
                display: 'flex',
                padding: '0.5rem 2rem',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div dangerouslySetInnerHTML={{ __html: listItem.label }} />
              {listItem.isCorrect && (
                <Icon style={{ color: Color.green() }} icon="check" />
              )}
              {listItem.isWrong && (
                <Icon style={{ color: Color.rose() }} icon="times" />
              )}
            </div>
          </nav>
        );
      })}
    </div>
  );
}
