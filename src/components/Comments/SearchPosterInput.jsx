import Input from '~/components/Texts/Input';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

export default function SearchPosterInput() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '1rem'
      }}
    >
      <span
        className={css`
          font-family: 'Roboto', sans-serif;
          font-size: 1.5rem;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.25rem;
          }
        `}
      >
        Filter comments by poster:
      </span>
      <Input
        onChange={() => console.log('change')}
        placeholder="Search by user"
        value={''}
        style={{
          margin: 0,
          width: '7rem',
          marginLeft: '1rem',
          fontSize: '1.5rem',
          height: 'auto'
        }}
        onKeyPress={(event) => {
          if (event.key === 'Enter') {
            console.log('enter');
          }
        }}
        className={css`
          @media (max-width: ${mobileMaxWidth}) {
            width: 5rem !important;
            height: 2.5rem !important;
            font-size: 1.1rem !important;
          }
        `}
      />
    </div>
  );
}
