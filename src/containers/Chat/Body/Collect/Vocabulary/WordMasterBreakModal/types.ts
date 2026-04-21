import React from 'react';

export interface SuggestedOmokUser {
  id: number;
  username: string;
  profilePicUrl?: string;
  lastActive?: number;
}

export interface WordMasterBreakModalProps {
  breakStatus: any;
  isOpen: boolean;
  loading?: boolean;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onClearBreak: () => Promise<any>;
  onPayBreak: () => Promise<any>;
  onSpinRoulette: () => Promise<any>;
  onLoadQuizQuestion: () => Promise<any>;
  onSubmitQuizAnswer: (selectedIndex: number) => Promise<any>;
  onOpenWordle?: () => void;
  onOpenGrammarGame?: () => void;
  onOpenAIStories?: () => void;
  onOpenDailyQuestion?: () => void;
  onOpenChessPuzzle?: () => void;
  onOpenPendingOmok?: (channelId: number) => void;
  onOpenOmokStart?: () => void;
  onStartOmokWithUser?: (user: SuggestedOmokUser) => void;
}

export interface BreakAccent {
  main: string;
  soft: string;
}

export interface BreakGuideRowData {
  breakNum: number;
  label: string;
  title: string;
  description: string;
  tone: string;
}

export interface RequirementRowItem {
  label: string;
  done: boolean;
  onClick?: () => void;
}

export interface RequirementSectionProps {
  title: string;
  description: string;
  rows: RequirementRowItem[];
  footer?: string;
  extra?: React.ReactNode;
  tone?: string;
}
