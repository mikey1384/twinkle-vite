import React from 'react';
import { useNavigate } from 'react-router-dom';
import HomeLoginPrompt from '~/components/HomeLoginPrompt';
import { useKeyContext } from '~/contexts';
import Grammarbles from '~/containers/Home/GrammarGameModal';

// /grammarbles: Grammarbles' own page (Mikey 10-07: it was a modal, and the
// games need the room). Leaving goes back to Home.
export default function GrammarblesPage() {
  const userId = useKeyContext((v) => v.myState.userId);
  const navigate = useNavigate();
  if (!userId) return <HomeLoginPrompt message="Log in to play Grammarbles" />;
  return <Grammarbles onHide={() => navigate('/')} />;
}
