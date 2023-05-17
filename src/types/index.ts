export interface Attachment {
  contentType?: string;
  id: number;
  file: File;
  fileType: string;
  imageUrl?: string;
  title: string;
}
export interface Card {
  askPrice: number;
  id: number;
  imagePath: string;
  isBurned: boolean;
  isBurning?: boolean;
  level: number;
  owner: User;
  quality: 'common' | 'superior' | 'rare' | 'elite' | 'legendary';
  style: string;
  word: string;
}
export interface Comment {
  id: number;
  comments: Comment[];
  commentId: number | null;
  content: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  isDeleted: boolean;
  isExpanded: boolean;
  isNotification: boolean;
  lastReplyId: number;
  likes: any[];
  loadMoreButton: boolean;
  isDeleteNotification: boolean;
  isLoadMoreButton: boolean;
  notFound: boolean;
  numReplies: number;
  parent: Content | User;
  recommendations: Recommendation[];
  rewards: Reward[];
  replyId: number;
  replies: Comment[];
  rootReplyId: number;
  targetObj: any;
  targetUserId: number;
  targetUserName: string;
  thumbUrl: string;
  timeStamp: number;
  uploader: User;
}

export interface Content {
  contentId: number;
  contentType: string;
  deleterId?: number;
  description?: string;
  id?: number;
  isClosedBy?: number | User;
  isTask?: boolean;
  missionId?: number;
  missionType?: string;
  reviewTimeStamp?: number;
  rootId?: number;
  rootMissionId?: number;
  rootObj?: Content | User;
  rootType?: string;
  settings?: any;
  timeStamp?: number;
  uploader?: User;
  [key: string]: any;
}

export type Dispatch = (action: { type: string; [key: string]: any }) => void;

export interface Link {
  id: number;
  numComments: number;
  title: string;
}

export interface PlaylistVideo {
  id: number;
  videoId: number;
}

export interface Playlist {
  id: number;
  title: string;
  playlist: PlaylistVideo[];
}

export interface Recommendation {
  id: number;
  userId: number;
}

export interface RequestHelpers {
  auth: () => any;
  handleError: (error: unknown) => void;
  token?: () => string | null;
}

export interface Reward {
  id: number;
  rewarderId: number;
  rewardComment: string;
}

export interface Subject {
  comments: Comment[];
  id: number;
  pinnedCommentId: number;
  rewards?: Reward[];
  secretAnswer: string;
  secretAttachment: Attachment;
  title: string;
  rewardLevel: number;
  userId?: number;
  uploader: User;
}

export interface User {
  authLevel?: number;
  banned?: {
    posting?: boolean;
  };
  canChangeUsername?: boolean;
  canDelete?: boolean;
  canEdit?: boolean;
  canEditPlaylists?: boolean;
  canPinPlaylists?: boolean;
  canEditRewardLevel?: boolean;
  canGenerateAICard?: boolean;
  canReward?: boolean;
  chatType?: string;
  collectType?: string;
  fileUploadLvl?: number;
  id: number;
  isOnline?: boolean;
  joinDate?: number;
  karmaPoints?: number;
  lastChannelId?: number;
  managementLevel?: number;
  numPics?: number;
  numWordsCollected?: number;
  otpHash?: string;
  pictures?: any[];
  profilePicUrl?: string;
  rewardBoostLvl?: number;
  state?: any;
  twinkleCoins?: number;
  twinkleXP?: number;
  username: string;
  value?: number;
  [key: string]: any;
}
