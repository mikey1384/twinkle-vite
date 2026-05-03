export type BuildRelationshipLabel = 'fork' | 'contribution';

export interface BuildRelationshipLike {
  title?: string | null;
  username?: string | null;
  sourceBuildId?: number | null;
  contributionBranchNumber?: number | null;
  contributionContributorId?: number | null;
  contributionStatus?: string | null;
  rootBuildSourceBuildId?: number | null;
  rootBuildTitle?: string | null;
}

export function getBuildDisplayTitle(build: BuildRelationshipLike) {
  const rawTitle = String(build.title || '').trim();
  if (isBuildContributionFork(build)) {
    const projectTitle = stripBuildRelationshipTitleSuffixes(
      String(build.rootBuildTitle || '').trim()
    );
    const branchTitle = getBuildBranchDisplayTitle(build);
    if (
      projectTitle &&
      branchTitle &&
      projectTitle.toLowerCase() !== branchTitle.toLowerCase()
    ) {
      return `${projectTitle} / ${branchTitle}`;
    }
    return branchTitle || projectTitle || 'Untitled Build';
  }
  if (!hasBuildRelationshipLabel(build)) {
    return rawTitle || 'Untitled Build';
  }
  return stripBuildRelationshipTitleSuffixes(rawTitle) || 'Untitled Build';
}

export function getBuildBranchDisplayTitle(build: BuildRelationshipLike) {
  const rawTitle = stripBuildRelationshipTitleSuffixes(
    String(build.title || '').trim()
  );
  const rootTitle = stripBuildRelationshipTitleSuffixes(
    String(build.rootBuildTitle || '').trim()
  );
  if (
    rawTitle &&
    (!rootTitle || rawTitle.toLowerCase() !== rootTitle.toLowerCase())
  ) {
    return rawTitle;
  }
  const contributorName = String(build.username || '').trim() || 'Contributor';
  const branchNumber = Number(build.contributionBranchNumber || 0);
  return branchNumber > 0
    ? `${contributorName}'s branch ${branchNumber}`
    : `${contributorName}'s branch`;
}

export function getBuildRelationshipLabels(
  build: BuildRelationshipLike
): BuildRelationshipLabel[] {
  const labels: BuildRelationshipLabel[] = [];
  if (hasBuildForkLabel(build)) {
    labels.push('fork');
  }
  if (isBuildContributionFork(build)) {
    labels.push('contribution');
  }
  return labels;
}

export function isBuildContributionFork(build: BuildRelationshipLike) {
  const status = normalizeContributionStatus(build.contributionStatus);
  return status !== 'none';
}

function hasBuildRelationshipLabel(build: BuildRelationshipLike) {
  return hasBuildForkLabel(build) || isBuildContributionFork(build);
}

function hasBuildForkLabel(build: BuildRelationshipLike) {
  if (isBuildContributionFork(build)) {
    return (
      Number(build.rootBuildSourceBuildId || 0) > 0 ||
      /\s+\(Fork\)(?:\s+\(Contribution\))?\s*$/i.test(
        String(build.title || '')
      )
    );
  }
  return (
    Number(build.sourceBuildId || 0) > 0 ||
    /\s+\(Fork\)\s*$/i.test(String(build.title || ''))
  );
}

function stripBuildRelationshipTitleSuffixes(value: string) {
  let nextTitle = value.trim();
  let previousTitle = '';
  while (nextTitle && nextTitle !== previousTitle) {
    previousTitle = nextTitle;
    nextTitle = nextTitle
      .replace(/\s+\((Fork|Contribution)\)\s*$/i, '')
      .trim();
  }
  return nextTitle;
}

function normalizeContributionStatus(value: unknown) {
  return value === 'draft' ||
    value === 'merging' ||
    value === 'merged'
    ? value
    : 'none';
}
