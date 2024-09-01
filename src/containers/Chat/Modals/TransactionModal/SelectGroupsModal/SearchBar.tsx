import React from 'react';
import SearchInput from '~/components/Texts/SearchInput';

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
      style={{ width: '100%', marginBottom: '1rem' }}
    />
  );
}
