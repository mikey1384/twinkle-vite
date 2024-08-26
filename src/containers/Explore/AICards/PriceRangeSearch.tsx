import React from 'react';
import Input from '~/components/Texts/Input';

interface PriceRangeSearchProps {
  priceRange: { min: string; max: string };
  onPriceRangeChange: (newPriceRange: { min: string; max: string }) => void;
}

export default function PriceRangeSearch({
  priceRange,
  onPriceRangeChange
}: PriceRangeSearchProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginTop: '1rem' }}>
      <Input
        placeholder="Min Price"
        type="number"
        value={priceRange.min}
        onChange={(text) => onPriceRangeChange({ ...priceRange, min: text })}
        style={{ width: '100px', marginRight: '0.5rem' }}
      />
      <span>-</span>
      <Input
        placeholder="Max Price"
        type="number"
        value={priceRange.max}
        onChange={(text) => onPriceRangeChange({ ...priceRange, max: text })}
        style={{ width: '100px', marginLeft: '0.5rem' }}
      />
    </div>
  );
}
