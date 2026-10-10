// The kid's own pick wins; otherwise the site's default image model is
// preselected (older stored approvals fall back to the first option) so the
// Energy approval is one tap instead of a forced model comparison.
export function resolveSelectedModelOption<T extends { id: string }>({
  modelOptions,
  pickedModelId,
  defaultModelId
}: {
  modelOptions: T[];
  pickedModelId?: string;
  defaultModelId?: string;
}): T | undefined {
  const options = Array.isArray(modelOptions) ? modelOptions : [];
  return (
    (pickedModelId
      ? options.find((option) => option.id === pickedModelId)
      : undefined) ||
    (defaultModelId
      ? options.find((option) => option.id === defaultModelId)
      : undefined) ||
    options[0]
  );
}
