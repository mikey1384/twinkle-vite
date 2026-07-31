import { isBuildListPath } from './List/helpers/url';
import { isPromptListPath } from '../Prompts/helpers/url';
import type { BuildStudioSection } from '~/contexts/Build/reducer';

export function getBuildStudioNavTarget({
  loggedIn,
  pathname,
  search,
  section,
  stateArrived
}: {
  loggedIn: boolean;
  pathname: string;
  search?: string;
  section?: BuildStudioSection | string | null;
  stateArrived: boolean;
}) {
  if (
    isBuildListPath(pathname, { loggedIn }) ||
    (loggedIn && isPromptListPath(pathname))
  ) {
    return `${pathname}${search || ''}`;
  }
  return loggedIn && stateArrived && section === 'prompts'
    ? '/prompts'
    : '/build';
}
