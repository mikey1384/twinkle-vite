import React from 'react';
import Input from '~/components/Texts/Input';

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
    <Input
      placeholder={placeholder}
      value={search}
      onChange={(text) => onChange(text)}
      style={{ width: '100%', marginBottom: '1rem' }}
    />
  );
}
