import React, { useState } from 'react';
import { css } from '@emotion/css';

export default function ThumbnailPicker({
  thumbnails,
  onSelect,
  initialSelectedIndex = 0
}: {
  thumbnails: string[];
  onSelect: (index: number) => void;
  initialSelectedIndex?: number;
}) {
  const [selectedThumbnailIndex, setSelectedThumbnailIndex] =
    useState(initialSelectedIndex);

  return (
    <div style={{ width: '100%' }}>
      <div
        className={css`
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 20px;
        `}
      >
        <img
          src={thumbnails[selectedThumbnailIndex]}
          alt="Selected Thumbnail"
          loading="lazy"
          fetchPriority="low"
          className={css`
            max-width: 100%;
            max-height: 300px;
            border: 2px solid #007bff;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          `}
        />
      </div>
      <div
        className={css`
          display: flex;
          justify-content: center;
          margin-top: 20px;
        `}
      >
        <div
          className={css`
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 10px;
          `}
        >
          {thumbnails.map((thumbnail, index) => (
            <img
              key={index}
              src={thumbnail}
              alt={`Thumbnail ${index + 1}`}
              loading="lazy"
              fetchPriority="low"
              className={css`
                width: 100%;
                height: auto;
                cursor: pointer;
                border: 2px solid
                  ${selectedThumbnailIndex === index
                    ? '#007bff'
                    : 'transparent'};
                transition: border-color 0.3s;
              `}
              onClick={() => handleThumbnailClick(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );

  function handleThumbnailClick(index: number) {
    setSelectedThumbnailIndex(index);
    onSelect(index);
  }
}
