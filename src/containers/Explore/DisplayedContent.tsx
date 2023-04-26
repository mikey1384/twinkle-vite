import React from 'react';
import AICards from './AICards';
import Videos from './Videos';
import Links from './Links';
import Subjects from './Subjects';

export default function DisplayedContent({ category }: { category: string }) {
  if (category === 'ai-cards') {
    return <AICards />;
  }
  if (category === 'videos') {
    return <Videos />;
  }
  if (category === 'links') {
    return <Links />;
  }
  if (category === 'subjects') {
    return <Subjects />;
  }
  return null;
}
