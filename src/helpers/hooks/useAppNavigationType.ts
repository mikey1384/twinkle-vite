import { createContext, createElement, useContext, type ReactNode } from 'react';
import { NavigationType, useNavigationType } from 'react-router-dom';

// The real PUSH / POP / REPLACE for the route the app is showing.
// NavigationFeedbackProvider renders the app through
// <Routes location={acceptedLocation}>, and React Router reports POP for every
// navigation inside a <Routes location> (it cannot know how that location was
// reached). The provider reads the true type outside its Routes and passes it
// down here, paired with the location it accepted.
const AppNavigationTypeContext = createContext<NavigationType | null>(null);

export function AppNavigationTypeProvider({
  navigationType,
  children
}: {
  navigationType: NavigationType;
  children?: ReactNode;
}) {
  return createElement(
    AppNavigationTypeContext.Provider,
    { value: navigationType },
    children
  );
}

// Outside the provider (tests, isolated trees) it is React Router's own value.
export function useAppNavigationType(): NavigationType {
  const routerNavigationType = useNavigationType();
  const appNavigationType = useContext(AppNavigationTypeContext);
  return appNavigationType ?? routerNavigationType;
}
