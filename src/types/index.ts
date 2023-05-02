export interface Card {
  askPrice: number;
  id: number;
  imagePath: string;
  isBurned: boolean;
  isBurning?: boolean;
  level: number;
  owner: User;
  quality: 'common' | 'superior' | 'rare' | 'elite' | 'legendary';
  word: string;
}
export interface Comment {
  commentId: number;
  content: string;
  id: number;
  isExpanded: boolean;
  likes: object[];
  loadMoreButton: boolean;
  recommendations: object[];
  rewards: Reward[];
  replyId: number;
  replies: Comment[];
}

export interface Content {
  contentId?: number;
  contentType?: string;
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

export interface RequestHelpers {
  auth: () => any;
  handleError: (error: unknown) => void;
  token?: () => string | null;
}

export interface Reward {
  id: number;
  rewardComment: string;
}

export interface Subject {
  id: number;
  rewards: Reward[];
  comments: Comment[];
  rewardLevel: number;
}

export interface User {
  id: number;
  userType: string;
  username: string;
}
