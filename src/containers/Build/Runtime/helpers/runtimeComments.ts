import { isBuildContributionFork } from '~/helpers/buildRelationshipHelpers';

export function buildRuntimeCommentsAreAvailable(
  build?: { contributionStatus?: string | null } | null
) {
  return Boolean(build && !isBuildContributionFork(build));
}
