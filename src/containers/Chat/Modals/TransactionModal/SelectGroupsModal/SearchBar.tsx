import React from 'react';
import SearchInput from '~/components/Texts/SearchInput';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

export default function SearchBar({
  placeholder,
  search,
  onChange
}: {
  placeholder: string;
  search: string;
  onChange: (value: string) => void;
}) {
  return (
    <SearchInput
      placeholder={placeholder}
      value={search}
      onChange={onChange}
      className={css`
        width: 70%;
        margin-bottom: 1rem;
        @media (max-width: ${mobileMaxWidth}) {
          width: 100%;
        }
      `}
    />
  );
}
