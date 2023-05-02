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

export type Dispatch = (action: { type: string; [key: string]: any }) => void;

export interface Link {
  id: number;
  numComments: number;
  title: string;
}

export interface Video {
  id: number;
  videoId: number;
}

export interface Playlist {
  id: number;
  title: string;
  playlist: Video[];
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
}
