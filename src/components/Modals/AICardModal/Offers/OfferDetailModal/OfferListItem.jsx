import ErrorBoundary from '~/components/ErrorBoundary';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function OfferListItem() {
  return (
    <ErrorBoundary componentPath="components/Modals/AICardModal/Offers/OfferListItem">
      <nav
        className={css`
          height: 7rem;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 1.6rem;
          cursor: pointer;
          &:hover {
            background-color: ${Color.highlightGray()};
          }
          @media (max-width: ${mobileMaxWidth}) {
            height: 3rem;
            font-size: 0.8rem;
          }
        `}
        onClick={() => console.log('clicked')}
      >
        item
      </nav>
    </ErrorBoundary>
  );
}
