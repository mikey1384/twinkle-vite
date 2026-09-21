import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LumineCommentContext } from '~/components/Comments/LumineCommentContext';
import { useAppContext } from '~/contexts';
import { useToast } from '~/contexts/Toast';
import { getBuildWorkspacePath } from '~/helpers/buildNavigationHelpers';
import {
  canUseBuildCommentInLumine,
  getBuildFeedbackComment,
  type BuildCommentFeedbackHandoff
} from '~/helpers/buildCommentFeedback';
import type { RuntimeBuild } from './types';

export default function CommentLumineProvider({
  build,
  userId,
  active,
  children
}: {
  build: RuntimeBuild;
  userId: number;
  active: boolean;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const toast = useToast();
  const ensureDefaultBranch = useAppContext(
    (v) => v.requestHelpers.ensureDefaultBuildContributionBranch
  );
  const [opening, setOpening] = useState(false);
  const requestRef = useRef<object | null>(null);
  const latestRef = useRef({ buildId: build.id, userId, active });
  latestRef.current = { buildId: build.id, userId, active };
  const enabled = active && canUseBuildCommentInLumine(build, userId);
  useEffect(() => {
    requestRef.current = null;
    setOpening(false);
    return () => {
      requestRef.current = null;
    };
  }, [build.id, userId, active]);
  const value = useMemo(
    () =>
      enabled
        ? {
            buildId: build.id,
            opening,
            onUseComment: handleUseComment
          }
        : null,
    // The handler reads this build and the latest request scope.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled, build, userId, opening]
  );

  return (
    <LumineCommentContext.Provider value={value}>
      {children}
    </LumineCommentContext.Provider>
  );

  async function handleUseComment(commentValue: any, parentValue?: any) {
    if (!enabled || requestRef.current) return;
    const comment = getBuildFeedbackComment(commentValue);
    if (!comment) return;
    const parentComment = getBuildFeedbackComment(parentValue);
    const token = {};
    requestRef.current = token;
    setOpening(true);
    const stillCurrent = () =>
      requestRef.current === token &&
      latestRef.current.buildId === build.id &&
      latestRef.current.userId === userId &&
      latestRef.current.active;
    try {
      let workspace = build;
      if (Number(build.userId) !== Number(userId)) {
        const result = await ensureDefaultBranch(build.id);
        if (!stillCurrent()) return;
        if (
          !result?.build?.id ||
          Number(result.build.userId) !== Number(userId) ||
          Number(result.build.contributionRootBuildId) !== Number(build.id)
        )
          throw new Error('Could not open your workspace. Please try again.');
        workspace = result.build;
      }
      if (!stillCurrent()) return;
      const commentFeedback: BuildCommentFeedbackHandoff = {
        userId,
        feedback: {
          buildId: build.id,
          buildTitle: build.title,
          comment,
          ...(parentComment && parentComment.id !== comment.id
            ? { parentComment }
            : {})
        }
      };
      navigate(getBuildWorkspacePath(workspace), {
        state: { commentFeedback }
      });
    } catch (error: any) {
      if (stillCurrent())
        toast({
          message:
            error?.response?.data?.error ||
            error?.message ||
            'Could not open Lumine. Please try again.'
        });
    } finally {
      if (stillCurrent()) {
        requestRef.current = null;
        setOpening(false);
      }
    }
  }
}
