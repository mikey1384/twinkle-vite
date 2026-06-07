import { useAppContext } from '~/contexts';

export default function useRequests() {
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const updateBuildProjectFiles = useAppContext(
    (v) => v.requestHelpers.updateBuildProjectFiles
  );
  const updateBuildMetadata = useAppContext(
    (v) => v.requestHelpers.updateBuildMetadata
  );
  const loadBuildThumbnailOptions = useAppContext(
    (v) => v.requestHelpers.loadBuildThumbnailOptions
  );
  const uploadBuildThumbnail = useAppContext(
    (v) => v.requestHelpers.uploadBuildThumbnail
  );
  const loadBuild = useAppContext((v) => v.requestHelpers.loadBuild);
  const loadBuildRuntimeUploads = useAppContext(
    (v) => v.requestHelpers.loadBuildRuntimeUploads
  );
  const deleteBuildRuntimeUpload = useAppContext(
    (v) => v.requestHelpers.deleteBuildRuntimeUpload
  );
  const getBuildApiToken = useAppContext(
    (v) => v.requestHelpers.getBuildApiToken
  );
  const listBuildRuntimeFiles = useAppContext(
    (v) => v.requestHelpers.listBuildRuntimeFiles
  );
  const uploadBuildRuntimeFiles = useAppContext(
    (v) => v.requestHelpers.uploadBuildRuntimeFiles
  );
  const deleteBuildChatMessage = useAppContext(
    (v) => v.requestHelpers.deleteBuildChatMessage
  );
  const routeBuildChatUpload = useAppContext(
    (v) => v.requestHelpers.routeBuildChatUpload
  );
  const createBuildChatAssistantNote = useAppContext(
    (v) => v.requestHelpers.createBuildChatAssistantNote
  );
  const createBuildChatUserNote = useAppContext(
    (v) => v.requestHelpers.createBuildChatUserNote
  );
  const createBuildChatReferenceNote = useAppContext(
    (v) => v.requestHelpers.createBuildChatReferenceNote
  );
  const cleanupBuildChatReferenceUploads = useAppContext(
    (v) => v.requestHelpers.cleanupBuildChatReferenceUploads
  );
  const uploadFile = useAppContext((v) => v.requestHelpers.uploadFile);
  const saveFileData = useAppContext((v) => v.requestHelpers.saveFileData);
  const publishBuild = useAppContext((v) => v.requestHelpers.publishBuild);
  const unpublishBuild = useAppContext((v) => v.requestHelpers.unpublishBuild);
  const forkBuild = useAppContext((v) => v.requestHelpers.forkBuild);
  const deleteBuild = useAppContext((v) => v.requestHelpers.deleteBuild);
  const createBuildContributionFork = useAppContext(
    (v) => v.requestHelpers.createBuildContributionFork
  );
  const loadBuildContributions = useAppContext(
    (v) => v.requestHelpers.loadBuildContributions
  );
  const loadBuildContribution = useAppContext(
    (v) => v.requestHelpers.loadBuildContribution
  );
  const loadBuildContributionMergeIntoMyBranch = useAppContext(
    (v) => v.requestHelpers.loadBuildContributionMergeIntoMyBranch
  );
  const mergeBuildContribution = useAppContext(
    (v) => v.requestHelpers.mergeBuildContribution
  );
  const mergeBuildContributionIntoMyBranch = useAppContext(
    (v) => v.requestHelpers.mergeBuildContributionIntoMyBranch
  );
  const replaceMainWithBuildContribution = useAppContext(
    (v) => v.requestHelpers.replaceMainWithBuildContribution
  );
  const replaceBuildContributionIntoMyBranch = useAppContext(
    (v) => v.requestHelpers.replaceBuildContributionIntoMyBranch
  );
  const updateBuildContributionFromMain = useAppContext(
    (v) => v.requestHelpers.updateBuildContributionFromMain
  );
  const updateBuildLumineChatVisibility = useAppContext(
    (v) => v.requestHelpers.updateBuildLumineChatVisibility
  );
  const updateBuildLumineModelPreference = useAppContext(
    (v) => v.requestHelpers.updateBuildLumineModelPreference
  );
  const loadBuildContributors = useAppContext(
    (v) => v.requestHelpers.loadBuildContributors
  );
  const purchaseBuildGenerationReset = useAppContext(
    (v) => v.requestHelpers.purchaseBuildGenerationReset
  );

  return {
    cleanupBuildChatReferenceUploads,
    createBuildChatAssistantNote,
    createBuildChatReferenceNote,
    createBuildChatUserNote,
    createBuildContributionFork,
    deleteBuild,
    deleteBuildChatMessage,
    deleteBuildRuntimeUpload,
    forkBuild,
    getBuildApiToken,
    listBuildRuntimeFiles,
    loadBuild,
    loadBuildContribution,
    loadBuildContributionMergeIntoMyBranch,
    loadBuildContributions,
    loadBuildContributors,
    loadBuildRuntimeUploads,
    loadBuildThumbnailOptions,
    mergeBuildContribution,
    mergeBuildContributionIntoMyBranch,
    onSetUserState,
    publishBuild,
    purchaseBuildGenerationReset,
    replaceBuildContributionIntoMyBranch,
    replaceMainWithBuildContribution,
    routeBuildChatUpload,
    saveFileData,
    unpublishBuild,
    updateBuildContributionFromMain,
    updateBuildLumineChatVisibility,
    updateBuildLumineModelPreference,
    updateBuildMetadata,
    updateBuildProjectFiles,
    uploadBuildRuntimeFiles,
    uploadBuildThumbnail,
    uploadFile
  };
}
