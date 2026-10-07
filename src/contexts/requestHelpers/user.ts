import {
  type AiImageQuality,
  type OpenAiImageModel
} from '~/helpers/aiImageModels';
import request from './axiosInstance';
import axios from 'axios';
import URL from '~/constants/URL';
import { trackEvent } from '~/helpers/analytics';
import { clientVersion } from '~/constants/defaultValues';
import { RequestHelpers } from '~/types';
import { queryStringForArray } from '~/helpers/stringHelpers';
import {
  getTwinkleDeviceId,
  persistAuthToken
} from '~/helpers/userDataHelpers';
import type {
  ChatNotificationPreferences,
  ChatNotificationSettings
} from '~/types/chat';
import { SITE_NAME } from '~/constants/siteBrand';
import { getEmailTicket, rememberEmailTicket } from '~/helpers/signupPasses';

interface GuardianConsentView {
  status: 'pending' | 'approved' | 'declined' | 'expired' | 'used';
  childFirstName: string;
  inviteSource: 'guest' | 'minecraft';
  inviterName: string;
  minecraftName?: string;
  expiresAt: number;
}

const SESSION_STORAGE_ERROR_MESSAGE =
  `${SITE_NAME} could not save your login on this device. Check that browser storage is enabled, then try again.`;

function createSessionPersistenceError(code: string, message: string) {
  const error: any = new Error(message);
  error.status = 500;
  error.code = code;
  return error;
}

function persistReturnedSessionToken(
  token: unknown,
  options: { preserveNavSession?: boolean } = {}
) {
  if (typeof token !== 'string' || !token) {
    throw createSessionPersistenceError(
      'auth_session_missing',
      `${SITE_NAME} did not receive a login session. Please try again.`
    );
  }
  if (!persistAuthToken(token, options)) {
    throw createSessionPersistenceError(
      'auth_token_storage_unavailable',
      SESSION_STORAGE_ERROR_MESSAGE
    );
  }
}

export default function userRequestHelpers({
  auth,
  handleError,
  token
}: RequestHelpers) {
  return {
    async checkIfPasswordMatches(password: string) {
      try {
        const {
          data: { passwordMatches }
        } = await request.get(
          `${URL}/user/password?password=${password}`,
          auth()
        );
        return passwordMatches;
      } catch (error) {
        return handleError(error);
      }
    },
    async checkIfUsernameExists(username: string) {
      try {
        const {
          data: { exists }
        } = await request.get(
          `${URL}/user/username/exists?username=${username}`,
          auth()
        );
        return exists;
      } catch (error) {
        return handleError(error);
      }
    },
    async changePassword({
      password,
      resetToken
    }: {
      password: string;
      resetToken: string;
    }) {
      let data;
      try {
        ({ data } = await request.put(`${URL}/user/password/reset`, {
          password,
          resetToken
        }));
      } catch (error) {
        return handleError(error);
      }
      persistReturnedSessionToken(data.token);
      return data;
    },
    async changePasswordFromStore({
      currentPassword,
      newPassword
    }: {
      currentPassword: string;
      newPassword: string;
    }) {
      let data;
      try {
        ({ data } = await request.put(
          `${URL}/user/password/change`,
          { currentPassword, newPassword },
          auth()
        ));
      } catch (error) {
        return handleError(error);
      }
      const { isSuccess, token: nextToken } = data;
      if (isSuccess) {
        persistReturnedSessionToken(nextToken, { preserveNavSession: true });
      }
      return { isSuccess };
    },
    async changeUsername(newUsername: string) {
      try {
        const {
          data: { alreadyExists, coins }
        } = await request.put(`${URL}/user/username`, { newUsername }, auth());
        return { alreadyExists, coins };
      } catch (error) {
        return handleError(error);
      }
    },
    async updateImageGenerationSettings({
      engine,
      followUpEngine,
      model,
      followUpModel,
      quality,
      followUpQuality
    }: {
      engine?: 'gemini' | 'openai';
      followUpEngine?: 'gemini' | 'openai';
      model?: OpenAiImageModel;
      followUpModel?: OpenAiImageModel;
      quality?: AiImageQuality;
      followUpQuality?: AiImageQuality;
    }) {
      try {
        const { data } = await request.put(
          `${URL}/user/settings/imageGeneration`,
          {
            engine,
            followUpEngine,
            model,
            followUpModel,
            quality,
            followUpQuality
          },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async updateImageEditorSettings({
      color,
      recentColors
    }: {
      color?: string;
      recentColors?: string[];
    }) {
      try {
        const { data } = await request.put(
          `${URL}/user/settings/imageEditor`,
          { color, recentColors },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async confirmPassword(password: string) {
      try {
        const {
          data: { success }
        } = await request.post(
          `${URL}/user/password/confirm`,
          { password },
          auth()
        );
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async deletePreviousUsername(username: string) {
      try {
        const {
          data: { success }
        } = await request.delete(
          `${URL}/user/username/previous?username=${username}`,
          auth()
        );
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async deleteProfilePictures(remainingPictures: object[]) {
      const queryString = queryStringForArray({
        array: remainingPictures,
        originVar: 'id',
        destinationVar: 'remainingPictureIds'
      });
      try {
        const { data } = await request.delete(
          `${URL}/user/picture?${queryString}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async deleteArchivedPicture(pictureId: number) {
      try {
        const { data } = await request.delete(
          `${URL}/user/picture/archive?pictureId=${pictureId}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async editRewardComment({
      editedComment,
      contentId
    }: {
      editedComment: string;
      contentId: number;
    }) {
      try {
        await request.put(
          `${URL}/user/reward`,
          { editedComment, contentId },
          auth()
        );
        return;
      } catch (error) {
        return handleError(error);
      }
    },
    async resolveLumineRescue(
      eventType: string,
      params?: Record<string, any>
    ) {
      try {
        const { data } = await request.post(
          `${URL}/user/lumine-rescue/resolve`,
          { eventType, ...(params || {}) },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async redeemLumineRescue(
      eventType: string,
      params?: Record<string, any>
    ) {
      try {
        const { data } = await request.post(
          `${URL}/user/lumine-rescue/redeem`,
          { eventType, ...(params || {}) },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadFeaturedSubjectsOnProfile(userId: number) {
      try {
        const { data: subjects } = await request.get(
          `${URL}/user/featured/subjects?userId=${userId}`,
          auth()
        );
        return subjects;
      } catch (error) {
        return handleError(error);
      }
    },
    async featureSubjectsOnProfile({ selected }: { selected: number[] }) {
      try {
        const { data: subjects } = await request.post(
          `${URL}/user/featured/subjects`,
          { selectedSubjects: selected },
          auth()
        );
        return subjects;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadPinnedAICardsOnProfile(userId: number) {
      try {
        const config = token?.() ? auth() : undefined;
        const { data } = await request.get(
          `${URL}/user/profile/pinnedAICards?userId=${userId}`,
          config
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadPinnedBuildsOnProfile(userId: number) {
      try {
        const config = token?.() ? auth() : undefined;
        const { data } = await request.get(
          `${URL}/user/profile/pinnedBuilds?userId=${userId}`,
          config
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async pinAICardsOnProfile({ cardIds }: { cardIds: number[] }) {
      try {
        const { data } = await request.put(
          `${URL}/user/profile/pinnedAICards`,
          { cardIds },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async pinBuildsOnProfile({ buildIds }: { buildIds: number[] }) {
      try {
        const { data } = await request.put(
          `${URL}/user/profile/pinnedBuilds`,
          { buildIds },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async updateProfileSectionOrder(sectionOrder: string[]) {
      try {
        const { data } = await request.put(
          `${URL}/user/profile/sections`,
          { sectionOrder },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async revokeReward(rewardId: number) {
      try {
        const {
          data: { success }
        } = await request.delete(
          `${URL}/user/reward?rewardId=${rewardId}`,
          auth()
        );
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async recordUserTraffic(pathname: string) {
      if (!token?.()) {
        request.post(`${URL}/user/recordAnonTraffic`, { pathname });
        return {};
      }
      try {
        const { data } = await request.get(
          `${URL}/user/traffic?pathname=${pathname}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    // Bridge Builder meetup quest (achievement type 'meetup'):
    // /achievements/bridge-builder and the admin review controls there.
    async loadMeetupQuest(crewId?: number) {
      try {
        const { data } = await request.get(
          `${URL}/user/meetup-quest${crewId ? `?crewId=${crewId}` : ''}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMeetupPublicCrew(crewId: number) {
      try {
        const { data } = await request.get(
          `${URL}/user/meetup-quest/crews/${crewId}/public`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMeetupCrew(crewId: number) {
      try {
        const { data } = await request.get(
          `${URL}/user/meetup-quest/crews/${crewId}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async updateMeetupCrewProfile({
      crewId,
      name,
      about,
      cover
    }: {
      crewId: number;
      name?: string;
      about?: string;
      cover?: string;
    }) {
      try {
        const { data } = await request.put(
          `${URL}/user/meetup-quest/crews/${crewId}/profile`,
          { name, about, cover },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async setMeetupCrewOpen({ crewId, isOpen }: { crewId: number; isOpen: boolean }) {
      try {
        const { data } = await request.put(
          `${URL}/user/meetup-quest/crews/${crewId}/open`,
          { isOpen },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async inviteToMeetupCrew({ crewId, username }: { crewId: number; username: string }) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/crews/${crewId}/invites`,
          { username },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async cancelMeetupInvite({ crewId, inviteId }: { crewId: number; inviteId: number }) {
      try {
        const { data } = await request.delete(
          `${URL}/user/meetup-quest/crews/${crewId}/invites/${inviteId}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async acceptMeetupInvite({ inviteId, branch }: { inviteId: number; branch: string }) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/invites/${inviteId}/accept`,
          { branch },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async declineMeetupInvite(inviteId: number) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/invites/${inviteId}/decline`,
          {},
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async makeMeetupCrewFounder({ crewId, userId }: { crewId: number; userId: number }) {
      try {
        const { data } = await request.put(
          `${URL}/user/meetup-quest/crews/${crewId}/founder`,
          { userId },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async disbandMeetupCrew(crewId: number) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/crews/${crewId}/disband`,
          {},
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    // Bridge Builder funnel telemetry; fire-and-forget, never shown to anyone.
    async trackMeetupQuestView(kind: string) {
      try {
        await request.post(`${URL}/user/meetup-quest/track`, { kind }, auth());
      } catch (_error) {
        // telemetry never interrupts the page
      }
    },
    async dismissMeetupNotice(crewId: number) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/notices/${crewId}/dismiss`,
          {},
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMeetupStaffSummary() {
      try {
        const { data } = await request.get(`${URL}/user/meetup-quest/staff`, auth());
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMeetupDesk(viewAs?: number) {
      try {
        const { data } = await request.get(`${URL}/user/meetup-quest/desk${viewAs ? `?viewAs=${viewAs}` : ''}`, auth());
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadCoordinatorApplications(viewAs?: number) {
      try {
        const { data } = await request.get(`${URL}/user/meetup-quest/coordinator${viewAs ? `?viewAs=${viewAs}` : ''}`, auth());
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadStaffApplication({ crewId, viewAs }: { crewId: number; viewAs?: number }) {
      try {
        const { data } = await request.get(`${URL}/user/meetup-quest/coordinator/${crewId}${viewAs ? `?viewAs=${viewAs}` : ''}`, auth());
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async previewCoordinatorEmail(crewId: number) {
      try {
        const { data } = await request.get(`${URL}/user/meetup-quest/coordinator/${crewId}/email-preview`, auth());
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async decideMeetupPlan({
      crewId,
      action,
      note,
      venue
    }: {
      crewId: number;
      action: 'approve' | 'send-back';
      note?: string;
      venue?: unknown;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/desk/crews/${crewId}/decision`,
          { action, note, venue },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async changeMeetupVenue({ crewId, venue }: { crewId: number; venue: unknown }) {
      try {
        const { data } = await request.put(
          `${URL}/user/meetup-quest/desk/crews/${crewId}/venue`,
          { venue },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async confirmMeetupSlot({
      crewId,
      slotIndex,
      slot
    }: {
      crewId: number;
      slotIndex?: number;
      slot?: { date: string; start: string; end: string };
    }) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/coordinator/${crewId}/slot`,
          { slotIndex, slot },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async addMeetupStaffNote({ crewId, note }: { crewId: number; note: string }) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/coordinator/${crewId}/notes`,
          { note },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async resendCoordinatorEmail(crewId: number) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/coordinator/${crewId}/resend-email`,
          {},
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    // "People you already know on Twinkle" (the viewer's own chats / comment replies)
    async loadMeetupKnownPeople(crewId?: number) {
      try {
        const { data } = await request.get(
          `${URL}/user/meetup-quest/known-people${crewId ? `?crewId=${crewId}` : ''}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    // Bridge Builder branch registry: choices for the pickers, and the admin's
    // review of one branch (the owner alert's card)
    async loadMeetupBranchChoices() {
      try {
        const { data } = await request.get(`${URL}/user/meetup-quest/branches`, auth());
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMeetupBranch(branchId: number) {
      try {
        const { data } = await request.get(
          `${URL}/user/meetup-quest/branches/${branchId}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async reviewMeetupBranch({
      branchId,
      action,
      mergeIntoId,
      note
    }: {
      branchId: number;
      action: 'official' | 'reject' | 'merge';
      mergeIntoId?: number;
      note?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/branches/${branchId}/review`,
          { action, mergeIntoId, note },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadInviteCandidateStatuses({
      crewId,
      userIds
    }: {
      crewId: number;
      userIds: number[];
    }) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/crews/${crewId}/invite-status`,
          { userIds },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMyMeetupQuestSummary() {
      try {
        const { data } = await request.get(
          `${URL}/user/meetup-quest/me`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async startMeetupCrew(
      params:
        | string
        | { branch: string; name?: string; about?: string; cover?: string }
    ) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/crews`,
          typeof params === 'string' ? { branch: params } : params,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async joinMeetupCrew({ crewId, branch }: { crewId: number; branch: string }) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/crews/${crewId}/join`,
          { branch },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async leaveMeetupCrew(crewId: number) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/crews/${crewId}/leave`,
          {},
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async removeMeetupCrewMember({
      crewId,
      memberId
    }: {
      crewId: number;
      memberId: number;
    }) {
      try {
        const { data } = await request.delete(
          `${URL}/user/meetup-quest/crews/${crewId}/members/${memberId}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    // the crew manager asks a member to correct their branch answer
    async nudgeMeetupBranch({ crewId, userId }: { crewId: number; userId: number }) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/crews/${crewId}/members/${userId}/nudge-branch`,
          {},
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    // staff's "who are you" check: admins ask / accept / ask again / withdraw
    async decideMeetupInfoCheck({
      crewId,
      userId,
      action,
      note
    }: {
      crewId: number;
      userId: number;
      action: string;
      note?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/crews/${crewId}/members/${userId}/info-check`,
          { action, note },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    // the asked member answers: teacher + class, or how they know the crew
    async answerMeetupInfoCheck({
      crewId,
      teacherName,
      className,
      relationship
    }: {
      crewId: number;
      teacherName: string;
      className: string;
      relationship: string;
    }) {
      try {
        const { data } = await request.put(
          `${URL}/user/meetup-quest/crews/${crewId}/me/info`,
          { teacherName, className, relationship },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    // the owner reviews parent emails before they go out
    async loadMeetupEmails() {
      try {
        const { data } = await request.get(`${URL}/user/meetup-quest/emails`, auth());
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async saveMeetupEmail({ id, subject, body }: { id: number; subject: string; body: string }) {
      try {
        const { data } = await request.put(
          `${URL}/user/meetup-quest/emails/${id}`,
          { subject, body },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async sendMeetupEmail({ id, subject, body }: { id: number; subject: string; body: string }) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/emails/${id}/send`,
          { subject, body },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async discardMeetupEmail(id: number) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/emails/${id}/discard`,
          {},
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async setMeetupEmailReview(on: boolean) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/emails/review`,
          { on },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    // the friends kill switch (owner only)
    async loadFriendsSwitch() {
      try {
        const { data } = await request.get(`${URL}/user/meetup-quest/friends-switch`, auth());
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async setFriendsSwitch(on: boolean) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/friends-switch`,
          { on },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    // friends: a simple link between two members (profile button)
    async loadFriendsOverview() {
      try {
        const { data } = await request.get(`${URL}/user/friends`, auth());
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadFriendStatus(targetId: number) {
      try {
        const { data } = await request.get(`${URL}/user/friends/status`, {
          ...auth(),
          params: { targetId }
        });
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async addFriend(targetId: number) {
      try {
        const { data } = await request.post(`${URL}/user/friends/${targetId}`, {}, auth());
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async removeFriend(targetId: number) {
      try {
        const { data } = await request.delete(`${URL}/user/friends/${targetId}`, auth());
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async replaceMeetupCrewMember({
      crewId,
      memberId,
      username
    }: {
      crewId: number;
      memberId: number;
      username: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/crews/${crewId}/members/${memberId}/replace`,
          { username },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async updateMyMeetupMembership({
      crewId,
      branch,
      parentOk
    }: {
      crewId: number;
      branch?: string;
      parentOk?: boolean;
    }) {
      try {
        const { data } = await request.put(
          `${URL}/user/meetup-quest/crews/${crewId}/me`,
          { branch, parentOk },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async setMeetupCrewAdult({
      crewId,
      kind,
      name
    }: {
      crewId: number;
      kind: string;
      name: string;
    }) {
      try {
        const { data } = await request.put(
          `${URL}/user/meetup-quest/crews/${crewId}/adult`,
          { kind, name },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async submitMeetupPlan({
      crewId,
      date,
      time,
      area,
      activity
    }: {
      crewId: number;
      date: string;
      time?: string;
      area: string;
      activity: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/crews/${crewId}/plan`,
          { date, time, area, activity },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async submitMeetupVideo({
      crewId,
      videoKey
    }: {
      crewId: number;
      videoKey: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/crews/${crewId}/video`,
          { videoKey },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async reviewMeetupCrew({
      crewId,
      action,
      note,
      attendedUserIds
    }: {
      crewId: number;
      action: 'approve-crew' | 'approve-grownup' | 'approve-plan' | 'send-back' | 'approve';
      note?: string;
      attendedUserIds?: number[];
    }) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/crews/${crewId}/review`,
          { action, note, attendedUserIds },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    // Bridge Builder story pages (twinkle-api user/routes/meetupStory.ts):
    // examples, the history hall, story pages, the crew's editor, the
    // parents' consent page and Mikey's approval.
    async loadMeetupSampleStories() {
      try {
        const { data } = await request.get(`${URL}/user/meetup-quest/samples`);
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMeetupSampleStory(slug: string) {
      try {
        const { data } = await request.get(
          `${URL}/user/meetup-quest/samples/${encodeURIComponent(slug)}`
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMeetupStoryHall(before?: number) {
      try {
        const { data } = await request.get(
          `${URL}/user/meetup-quest/stories${before ? `?before=${before}` : ''}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMeetupStoriesOverview() {
      try {
        const { data } = await request.get(
          `${URL}/user/meetup-quest/stories-overview`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMeetupStory(storyId: number) {
      try {
        const { data } = await request.get(
          `${URL}/user/meetup-quest/stories/${storyId}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadUserMeetupStories(userId: number) {
      try {
        const { data } = await request.get(
          `${URL}/user/meetup-quest/users/${userId}/stories`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMyMeetupStoryReveals() {
      try {
        const { data } = await request.get(
          `${URL}/user/meetup-quest/story-reveals`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async markMeetupStoryRevealSeen(storyId: number) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/stories/${storyId}/reveal-seen`,
          {},
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMeetupStoryEditor(crewId: number) {
      try {
        const { data } = await request.get(
          `${URL}/user/meetup-quest/crews/${crewId}/story`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async startMeetupStory(crewId: number) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/crews/${crewId}/story`,
          {},
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async saveMeetupStory({
      storyId,
      patch
    }: {
      storyId: number;
      patch: Record<string, unknown>;
    }) {
      try {
        const { data } = await request.put(
          `${URL}/user/meetup-quest/stories/${storyId}`,
          { patch },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async addMeetupStoryMedia({
      storyId,
      ...input
    }: {
      storyId: number;
      kind: 'photo' | 'clip';
      key: string;
      posterKey?: string;
      width?: number;
      height?: number;
      durationSec?: number;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/stories/${storyId}/media`,
          input,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async updateMeetupStoryMedia({
      storyId,
      mediaId,
      ...input
    }: {
      storyId: number;
      mediaId: number;
      caption?: string;
      taggedUserIds?: number[];
      noFaces?: boolean;
    }) {
      try {
        const { data } = await request.put(
          `${URL}/user/meetup-quest/stories/${storyId}/media/${mediaId}`,
          input,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async removeMeetupStoryMedia({
      storyId,
      mediaId
    }: {
      storyId: number;
      mediaId: number;
    }) {
      try {
        const { data } = await request.delete(
          `${URL}/user/meetup-quest/stories/${storyId}/media/${mediaId}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async reorderMeetupStoryMedia({
      storyId,
      mediaIds
    }: {
      storyId: number;
      mediaIds: number[];
    }) {
      try {
        const { data } = await request.put(
          `${URL}/user/meetup-quest/stories/${storyId}/media-order`,
          { mediaIds },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async setMeetupStoryParentEmail({
      storyId,
      userId,
      email
    }: {
      storyId: number;
      userId: number;
      email: string;
    }) {
      try {
        const { data } = await request.put(
          `${URL}/user/meetup-quest/stories/${storyId}/parent-email`,
          { userId, email },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async requestMeetupStoryConsents(storyId: number) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/stories/${storyId}/consents`,
          {},
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async submitMeetupStory(storyId: number) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/stories/${storyId}/submit`,
          {},
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async reviewMeetupStory({
      storyId,
      action,
      note,
      announce
    }: {
      storyId: number;
      action: 'publish' | 'send-back' | 'unpublish';
      note?: string;
      announce?: boolean;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/stories/${storyId}/review`,
          { action, note, announce },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    // Bridge Builder parent consent: the member's "ask my parent", and the
    // parent's own page (no account; the link's token is the key)
    async askMeetupParent({
      crewId,
      email,
      language
    }: {
      crewId: number;
      email?: string;
      language?: 'ko' | 'en';
    }) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/crews/${crewId}/ask-parent`,
          { email, language },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    // staff answer a parent's question (shown on their page, and emailed)
    async replyToMeetupParent({
      crewId,
      userId,
      reply
    }: {
      crewId: number;
      userId: number;
      reply: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/crews/${crewId}/parents/${userId}/reply`,
          { reply },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    // owner-only: things only the Twinkle organization can decide
    async loadMeetupOrgAsks() {
      try {
        const { data } = await request.get(`${URL}/user/meetup-quest/org-asks`, auth());
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async setMeetupOrgAskStatus({
      slug,
      status,
      note
    }: {
      slug: string;
      status: string;
      note?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/org-asks/${encodeURIComponent(slug)}/status`,
          { status, note },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async saveMeetupOrgRecipient(email: string) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/org-asks/recipient`,
          { email },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async composeMeetupOrgEmail(slugs: string[]) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/org-asks/compose`,
          { slugs },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMeetupParentBrief(token: string) {
      try {
        const { data } = await request.get(
          `${URL}/user/meetup-quest/parent-brief?token=${encodeURIComponent(token)}`
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async decideMeetupParentBrief({
      token,
      decision,
      question,
      shareContact,
      guardianChoice,
      attendingName
    }: {
      token: string;
      decision: 'approve' | 'decline' | 'question';
      question?: string;
      shareContact?: boolean;
      guardianChoice?: 'self' | 'named';
      attendingName?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/parent-brief/decision`,
          { token, decision, question, shareContact, guardianChoice, attendingName }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    // a crew member reopens the plan to revise it (after parents' suggestions)
    async reviseMeetupPlan(crewId: number) {
      try {
        const { data } = await request.post(`${URL}/user/meetup-quest/crews/${crewId}/plan/revise`, {}, auth());
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    // a parent suggests a change to the kids' plan (link token, no account)
    async suggestMeetupPlanChange({ token, body }: { token: string; body: string }) {
      try {
        const { data } = await request.post(`${URL}/user/meetup-quest/parent-brief/suggest`, { token, body });
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMeetupStoryConsent(token: string) {
      try {
        const { data } = await request.get(
          `${URL}/user/meetup-quest/story-consent?token=${encodeURIComponent(token)}`
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async decideMeetupStoryConsent({
      token,
      decision
    }: {
      token: string;
      decision: 'approve' | 'decline' | 'withdraw';
    }) {
      try {
        const { data } = await request.post(
          `${URL}/user/meetup-quest/story-consent/decision`,
          { token, decision }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMyAchievements() {
      try {
        const { data } = await request.get(`${URL}/user/achievements`, auth());
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadAchievementsByUserId(userId: number) {
      try {
        const { data } = await request.get(
          `${URL}/user/achievements/byId?userId=${userId}`
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadUsersByAchievementId(achievementId: number) {
      try {
        const {
          data: { users, hasMore }
        } = await request.get(
          `${URL}/user/achievements/users?achievementId=${achievementId}`,
          auth()
        );
        return { users, hasMore };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadCoinHistory(lastId: number) {
      try {
        const {
          data: { totalCoins, changes, loadMoreShown }
        } = await request.get(
          `${URL}/user/coin/history${lastId ? `?lastId=${lastId}` : ''}`,
          auth()
        );
        return { totalCoins, changes, loadMoreShown };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMyData() {
      try {
        const { data } = await request.get(`${URL}/user/session`, {
          ...auth(),
          meta: {
            collapseKey: null,
            // The App session pipeline owns its bounded retry chain. Letting
            // the shared GET scheduler retry each one of those attempts would
            // multiply a lost-route recovery into as many as sixteen HTTP
            // attempts, keeping a mobile radio hot while providing no extra
            // canonical evidence.
            maxRetries: 0,
            totalTimeoutMs: 15_000
          }
        });
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadUsernameHistory({
      userId,
      lastId
    }: {
      userId: number;
      lastId?: number;
    }) {
      try {
        let url = `${URL}/user/username?userId=${userId}`;
        if (lastId) {
          url += `&lastId=${lastId}`;
        }

        const {
          data: { usernames, loadMoreShown }
        } = await request.get(url);

        return {
          usernames,
          loadMoreShown
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadUserPictures({
      lastPictureId,
      exclude
    }: {
      lastPictureId: number;
      exclude: number[];
    }) {
      const queryString = exclude
        ? queryStringForArray({
            array: exclude,
            originVar: 'id',
            destinationVar: 'currentPictureIds'
          })
        : '';
      try {
        const {
          data: { pictures, loadMoreShown }
        } = await request.get(
          `${URL}/user/picture/archive${
            queryString || lastPictureId ? '?' : ''
          }${queryString}${
            lastPictureId
              ? `${queryString ? '&' : ''}lastPictureId=${lastPictureId}`
              : ''
          }`,
          auth()
        );
        return { pictures, loadMoreShown };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadUserTitles() {
      try {
        const {
          data: { titles }
        } = await request.get(`${URL}/user/title`, auth());
        return titles;
      } catch (error) {
        return handleError(error);
      }
    },
    async updateUserTitle(title: string) {
      try {
        const {
          data: { success }
        } = await request.put(`${URL}/user/title`, { title }, auth());
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadKarmaPoints() {
      try {
        const {
          data: {
            karmaPoints,
            numTwinklesRewarded,
            numApprovedRecommendations,
            numPostsRewarded,
            numRecommended
          }
        } = await request.get(`${URL}/user/karma`, auth());
        return {
          karmaPoints,
          numTwinklesRewarded,
          numApprovedRecommendations,
          numPostsRewarded,
          numRecommended
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMonthlyLeaderboards(year: number) {
      try {
        const { data: leaderboards } = await axios.get(
          `${URL}/user/leaderBoard/monthly?year=${year}`
        );
        return leaderboards;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMonthlyXp(userId: number) {
      try {
        const { data } = await request.get(
          `${URL}/user/monthlyXp?userId=${userId}`
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadProfile(userId: number) {
      try {
        // signed in: the profile carries the viewer's friend button state
        const { data } = await request.get(`${URL}/user?userId=${userId}`, auth());
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadProfileViaUsername(username: string) {
      try {
        const {
          data: { pageNotExists, user }
        } = await request.get(
          `${URL}/user/username/check?username=${username}`,
          // signed in: emails follow the viewer (shown to members, both to the owner)
          auth()
        );
        return { pageNotExists, user };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadUserReferrals(userId: number) {
      try {
        const {
          data: { referrals }
        } = await request.get(`${URL}/user/referrals`, {
          params: { userId }
        });
        return referrals;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadRankings() {
      try {
        const {
          data: {
            all,
            top30s,
            allMonthly,
            top30sMonthly,
            myAllTimeRank,
            myMonthlyRank,
            myAllTimeXP,
            myMonthlyXP
          }
        } = await request.get(
          `${URL}/user/leaderBoard?_t=${Date.now()}`,
          auth()
        );
        return {
          all,
          top30s,
          allMonthly,
          top30sMonthly,
          myAllTimeRank,
          myMonthlyRank,
          myAllTimeXP,
          myMonthlyXP
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadTodayRankings() {
      try {
        const {
          data: { all, hasMore, myTodayRank, myTodayXP }
        } = await request.get(
          `${URL}/user/leaderBoard/today?_t=${Date.now()}`,
          auth()
        );
        return {
          all,
          hasMore,
          myTodayRank,
          myTodayXP
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadAllTodayRankings() {
      try {
        const {
          data: { all, myTodayRank, myTodayXP }
        } = await request.get(
          `${URL}/user/leaderBoard/today/all?_t=${Date.now()}`,
          auth()
        );
        return {
          all,
          myTodayRank,
          myTodayXP
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadTop30TodayRankings() {
      try {
        const {
          data: { all, myTodayRank, myTodayXP }
        } = await request.get(
          `${URL}/user/leaderBoard/today/top30?_t=${Date.now()}`,
          auth()
        );
        return {
          all,
          myTodayRank,
          myTodayXP
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadUsers({
      orderBy,
      lastUserId,
      lastActive,
      lastTwinkleXP
    }: {
      orderBy?: string;
      lastUserId?: number;
      lastActive?: number;
      lastTwinkleXP?: number;
    } = {}) {
      try {
        const { data } = await request.get(
          `${URL}/user/users${orderBy ? `?orderBy=${orderBy}` : ''}${
            lastUserId
              ? `${
                  orderBy ? '&' : '?'
                }lastUserId=${lastUserId}&lastActive=${lastActive}&lastTwinkleXP=${lastTwinkleXP}`
              : ''
          }`,
          // signed in: each card carries the viewer's friend button state
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadCoins() {
      try {
        const {
          data: { coins }
        } = await request.get(`${URL}/user/coin`, auth());
        return coins;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadXP() {
      try {
        const {
          data: { rank, xp }
        } = await request.get(`${URL}/user/xp`, auth());
        return { rank, xp };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMissionProgress(userId: number) {
      try {
        const { data } = await request.get(
          `${URL}/user/state/mission?userId=${userId}`
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadXpAcquisition(userId: number) {
      try {
        const { data } = await request.get(
          `${URL}/user/xp/acquisition?userId=${userId}`
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async login(params: { username: string; password: string }) {
      let data;
      try {
        ({ data } = await axios.post(`${URL}/user/login`, params, {
          headers: {
            'x-twinkle-device-id': getTwinkleDeviceId()
          }
        }));
      } catch (error: any) {
        if (error?.response?.status === 401) {
          return Promise.reject('Wrong username/password combination');
        }
        return handleError(error);
      }
      persistReturnedSessionToken(data.token);
      return data;
    },
    async recordLogout(authorization = auth()) {
      try {
        await request.post(`${URL}/user/logout`, null, authorization);
        return true;
      } catch (error) {
        console.error('Failed to record logout:', error);
        return false;
      }
    },
    async reorderProfilePictures(reorderedPictureIds: number[]) {
      try {
        const { data } = await request.put(
          `${URL}/user/picture/reorder`,
          { reorderedPictureIds },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async reportError({
      componentPath,
      info,
      message
    }: {
      componentPath: string;
      info?: string;
      message: string;
    }) {
      try {
        const {
          data: { success }
        } = await request.post(
          `${URL}/user/error`,
          { componentPath, info, message, clientVersion },
          auth()
        );
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async rewardUser({
      maxRewardAmountForOnePerson,
      explanation,
      amount,
      contentType,
      contentId,
      rootType,
      rootId,
      rewardContextType,
      rewardContextId,
      uploaderId,
      rewardType
    }: {
      maxRewardAmountForOnePerson: number;
      explanation?: string;
      amount: number;
      contentType: string;
      contentId: number;
      rootType?: string;
      rootId?: number;
      rewardContextType?: string;
      rewardContextId?: number;
      uploaderId: number;
      rewardType?: string;
    }) {
      try {
        const {
          data: { alreadyRewarded, reward, netCoins, rewardCaps, rewards }
        } = await request.post(
          `${URL}/user/reward`,
          {
            maxRewardAmountForOnePerson,
            rewardExplanation: explanation || '',
            amount,
            contentType,
            contentId,
            rootType,
            rootId,
            rewardContextType,
            rewardContextId,
            uploaderId,
            rewardType
          },
          {
            ...auth(),
            timeout: 30_000
          }
        );
        return { alreadyRewarded, reward, netCoins, rewardCaps, rewards };
      } catch (error) {
        return handleError(error);
      }
    },
    // withCards: complete profile cards (the Users page), with the viewer's
    // friend button state when signed in
    async searchUsers(query: string, { withCards = false } = {}) {
      try {
        const { data: users } = await axios.get(
          `${URL}/user/users/search?queryString=${query}${
            withCards ? '&withCards=1' : ''
          }`,
          withCards ? auth() : undefined
        );
        return users;
      } catch (error) {
        return handleError(error);
      }
    },
    async searchUsersWithAchievements(query: string) {
      try {
        const { data: users } = await request.get(
          `${URL}/user/users/search/achievements?queryString=${query}`
        );
        return users;
      } catch (error) {
        return handleError(error);
      }
    },
    async sendVerificationEmail({
      email,
      which,
      userId,
      isPasswordReset
    }: {
      email?: string;
      // account recovery names the address; the server looks it up
      which?: 'email' | 'verifiedEmail';
      userId: number;
      isPasswordReset: boolean;
    }) {
      try {
        const { data } = await request.put(
          `${URL}/user/email/verify`,
          {
            email,
            which,
            userId,
            isPasswordReset
          },
          // Carry x-twinkle-device-id so device-id bans suppress this recovery/
          // verification send (this is an unauthenticated flow, so the header is
          // only delivered when passed explicitly).
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async sendVerificationOTPEmail(email: string) {
      try {
        const {
          data: { success }
        } = await request.put(
          `${URL}/user/email/verify/otp`,
          {
            email
          },
          auth()
        );
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async sendVerificationOTPEmailForSignup(email: string) {
      try {
        const {
          data: { success }
        } = await request.put(
          `${URL}/user/signup/email/otp`,
          {
            email
          },
          // Carry x-twinkle-device-id so device-id bans suppress this signup OTP
          // send (unauthenticated flow — header only sent when passed explicitly).
          auth()
        );
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async setDefaultSearchFilter(filter: string) {
      try {
        const { data } = await request.post(
          `${URL}/user/searchFilter`,
          { filter },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async setBuildQuickAccessMode(mode: 'recent' | 'favorites') {
      try {
        const { data } = await request.post(
          `${URL}/user/buildQuickAccessMode`,
          { mode },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async setBuildHeaderCollapsed(collapsed: boolean) {
      try {
        const { data } = await request.post(
          `${URL}/user/buildHeaderCollapsed`,
          { collapsed },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async setLumineHeaderMinimized(minimized: boolean) {
      try {
        const { data } = await request.post(
          `${URL}/user/lumineHeaderMinimized`,
          { minimized },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async updateBuildStudioState(buildStudio: {
      activeTab?: string;
      browseModes?: {
        community?: string;
        open_source?: string;
      };
      section?: 'apps' | 'prompts';
      promptTab?: 'my' | 'community';
      promptBrowseModes?: {
        community?: 'recent' | 'leaderboard';
      };
    }) {
      try {
        const { data } = await request.put(
          `${URL}/user/state/build-studio`,
          { buildStudio },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async updateNavTabsState(navTabs: {
      order: string[];
      orderVersion: number;
      pinnedTabs: {
        id: string;
        to: string;
        icon: string;
        label: string;
        pinned: boolean;
      }[];
      minimized: string[];
      menuDiscovered?: boolean;
    }) {
      try {
        const { data } = await request.put(
          `${URL}/user/state/nav-tabs`,
          { navTabs },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async setTheme({ color }: { color: string }) {
      try {
        const { data } = await request.put(
          `${URL}/user/theme`,
          { color },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async signup({
      username,
      firstname,
      lastname,
      branchName,
      className,
      email,
      verifiedEmail,
      password,
      passphrase,
      invite,
      birthYear,
      birthMonth,
      guardianConsent,
      userType
    }: {
      branchName: string;
      className: string;
      username: string;
      firstname: string;
      lastname: string;
      email: string;
      verifiedEmail: string;
      password: string;
      passphrase: string;
      invite?: string;
      birthYear?: number;
      birthMonth?: number;
      guardianConsent?: { consentId: number; secret: string };
      userType: string;
    }) {
      let data;
      try {
        ({ data } = await request.post(
          `${URL}/user/signup`,
          {
            username,
            firstname,
            lastname,
            branchName,
            className,
            email,
            verifiedEmail,
            // the emailed code's proof, and the invite pass (if any) that
            // stands in for the sign-up question
            emailTicket: getEmailTicket(email),
            invite: invite || undefined,
            // invited sign-ups: the age answer, and under 14 the guardian's
            // approved consent
            birthYear: invite ? birthYear : undefined,
            birthMonth: invite ? birthMonth : undefined,
            guardianConsentId: invite ? guardianConsent?.consentId : undefined,
            guardianConsentSecret: invite ? guardianConsent?.secret : undefined,
            password,
            passphrase,
            userType
          },
          {
            headers: {
              'x-twinkle-device-id': getTwinkleDeviceId()
            }
          }
        ));
      } catch (error) {
        return handleError(error);
      }
      persistReturnedSessionToken(data.token);
      return data;
    },
    async createDevAccount() {
      let data;
      try {
        ({ data } = await request.post(`${URL}/user/dev/signup`, null, {
          headers: {
            'x-twinkle-device-id': getTwinkleDeviceId()
          }
        }));
      } catch (error) {
        return handleError(error);
      }
      persistReturnedSessionToken(data.token);
      return data;
    },
    async toggleHideWatched() {
      try {
        const {
          data: { hideWatched }
        } = await request.put(`${URL}/user/hideWatched`, {}, auth());
        return hideWatched;
      } catch (error) {
        return handleError(error);
      }
    },
    async toggleWordleStrictMode(strictMode: boolean) {
      try {
        const { data } = await request.put(
          `${URL}/user/wordleStrictMode`,
          { strictMode },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async updateCollectType(collectType: string) {
      try {
        const {
          data: { success }
        } = await request.put(
          `${URL}/user/collectType`,
          { collectType },
          auth()
        );
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async updateCurrentlyWatching({ watchCode }: { watchCode: string }) {
      const authorization = auth();
      const authExists = !!authorization.headers.authorization;
      if (authExists) {
        try {
          request.put(
            `${URL}/video/currentlyWatching`,
            { watchCode },
            authorization
          );
          return;
        } catch (error) {
          return handleError(error);
        }
      }
    },
    async collectRewardedCoins() {
      try {
        const {
          data: { coins }
        } = await request.post(`${URL}/user/coin/collect`, null, auth());
        return coins;
      } catch (error) {
        return handleError(error);
      }
    },
    async updateUserCoins({
      action,
      type,
      amount,
      target,
      targetId,
      totalDuration
    }: {
      action: string;
      type: string;
      amount: number;
      target: string;
      targetId: number;
      totalDuration: number;
    }) {
      try {
        const {
          data: { alreadyDone, coins }
        } = await request.post(
          `${URL}/user/coin`,
          { amount, action, target, targetId, totalDuration, type },
          auth()
        );
        return { alreadyDone, coins };
      } catch (error) {
        return handleError(error);
      }
    },
    async updateUserXP({
      amount,
      action,
      target,
      targetId,
      totalDuration,
      type,
      userId
    }: {
      amount: number;
      action: string;
      target: string;
      targetId: number;
      totalDuration: number;
      type: string;
      userId: number;
    }) {
      try {
        const {
          data: { xp, alreadyDone, maxReached, rank, coins }
        } = await request.post(
          `${URL}/user/xp`,
          { amount, action, target, targetId, totalDuration, type, userId },
          auth()
        );
        return { xp, alreadyDone, maxReached, rank, coins };
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadBio(params: object) {
      try {
        const { data } = await request.post(`${URL}/user/bio`, params, auth());
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadGreeting({ greeting }: { greeting: string }) {
      try {
        const { data } = await request.put(
          `${URL}/user/greeting`,
          { greeting },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadProfileInfo({
      email,
      website,
      youtubeName,
      youtubeUrl
    }: {
      email: string;
      website: string;
      youtubeName: string;
      youtubeUrl: string;
    }) {
      try {
        const { data } = await request.put(
          `${URL}/user/info`,
          {
            email,
            website,
            youtubeName,
            youtubeUrl
          },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async unlockAICardGeneration() {
      try {
        const {
          data: { success }
        } = await request.put(`${URL}/user/unlock/aiCard`, null, auth());
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async unlockUsernameChange() {
      try {
        const {
          data: { success }
        } = await request.put(`${URL}/user/unlock/username`, null, auth());
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async unlockDonorLicense() {
      try {
        const {
          data: { success }
        } = await request.put(`${URL}/user/unlock/donor`, null, auth());
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async makeDonation(amount: number) {
      try {
        const {
          data: { coins, donatedCoins, achievementUnlocked }
        } = await request.post(`${URL}/user/donate`, { amount }, auth());
        return { coins, donatedCoins, achievementUnlocked };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadChatNotificationSettings(): Promise<ChatNotificationSettings> {
      try {
        const { data } = await request.get(
          `${URL}/user/chatNotificationSettings`,
          auth()
        );
        return data;
      } catch (error) {
        await handleError(error);
        throw error;
      }
    },
    async updateChatNotificationPreferences(
      preferences: Partial<ChatNotificationPreferences>
    ): Promise<ChatNotificationSettings> {
      try {
        const { data } = await request.put(
          `${URL}/user/chatNotificationSettings/preferences`,
          { preferences },
          auth()
        );
        return data;
      } catch (error) {
        await handleError(error);
        throw error;
      }
    },
    async updateChatNotificationMute({
      channelId,
      muted
    }: {
      channelId: number;
      muted: boolean;
    }): Promise<ChatNotificationSettings> {
      try {
        const { data } = await request.put(
          `${URL}/user/chatNotificationSettings/mutes/${channelId}`,
          { muted },
          auth()
        );
        return data;
      } catch (error) {
        await handleError(error);
        throw error;
      }
    },
    async loadPushVapidKey() {
      try {
        const {
          data: { publicKey }
        } = await request.get(`${URL}/user/pushSubscriptions/vapidKey`, auth());
        return publicKey;
      } catch (error) {
        return handleError(error);
      }
    },
    async savePushSubscription(subscription: {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    }) {
      try {
        const {
          data: { success, chatNotificationSettings }
        } = await request.post(
          `${URL}/user/pushSubscriptions`,
          subscription,
          auth()
        );
        return { success, chatNotificationSettings };
      } catch (error) {
        return handleError(error);
      }
    },
    async deletePushSubscription(endpoint: string, authorization = auth()) {
      try {
        const {
          data: { success, chatNotificationSettings }
        } = await request.delete(
          `${URL}/user/pushSubscriptions?endpoint=${encodeURIComponent(
            endpoint
          )}`,
          authorization
        );
        return { success, chatNotificationSettings };
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadUserPic({
      caption,
      src,
      isProfilePic,
      uploadToken
    }: {
      caption: string;
      src: string;
      isProfilePic: boolean;
      uploadToken?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/user/picture`,
          { caption, src, isProfilePic, uploadToken },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async updateUserPictureCaption({
      caption,
      pictureId
    }: {
      caption: string;
      pictureId: number;
    }) {
      try {
        const { data } = await request.put(
          `${URL}/user/picture/caption`,
          { caption, pictureId },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async updateUserPictures(pictureIds: number[]) {
      try {
        const { data } = await request.put(
          `${URL}/user/picture/archive`,
          { pictureIds },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async upgradeFileUploadSize() {
      try {
        const {
          data: { success }
        } = await request.put(`${URL}/user/upgrade/uploadSize`, null, auth());
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async upgradeNumPics() {
      try {
        const {
          data: { success }
        } = await request.put(`${URL}/user/upgrade/numPics`, null, auth());
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async upgradeRewardBoost() {
      try {
        const {
          data: { success }
        } = await request.put(`${URL}/user/upgrade/rewardBoost`, null, auth());
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async verifyEmailViaOTP({ otp, email }: { otp: string; email: string }) {
      try {
        const {
          data: { success }
        } = await request.get(
          `${URL}/user/email/verify/otp?otp=${otp}&email=${email}`,
          auth()
        );
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async verifyEmailViaOTPForSignup({
      otp,
      email
    }: {
      otp: string;
      email: string;
    }) {
      try {
        const {
          data: { success, emailTicket }
        } = await request.get(
          `${URL}/user/signup/email/otp?otp=${encodeURIComponent(
            otp
          )}&email=${encodeURIComponent(email)}`,
          auth()
        );
        if (success) {
          rememberEmailTicket(email, emailTicket);
          trackEvent('sign_up_email_verify');
        }
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async verifyEmail({
      token,
      forPasswordReset
    }: {
      token: string;
      forPasswordReset: boolean;
    }) {
      try {
        const {
          data: { profilePicUrl, userId, username, errorMsg }
        } = await request.get(
          `${URL}/user/email/verify?token=${token}${
            forPasswordReset ? '&forPasswordReset=1' : ''
          }`,
          auth()
        );
        return { profilePicUrl, userId, username, errorMsg };
      } catch (error) {
        return handleError(error);
      }
    },
    async getSignupInvite(token: string) {
      try {
        const { data } = await request.get(
          `${URL}/user/signup/invite?token=${encodeURIComponent(token)}`
        );
        return data as {
          invite: {
            source: 'guest' | 'minecraft';
            inviterName: string;
            minecraftName?: string;
            expiresAt?: number;
          } | null;
          unavailable?: boolean;
        };
      } catch (error) {
        return handleError(error);
      }
    },
    // signed in with a Minecraft vouch link: link that player to this account
    async linkMinecraftInvite(token: string) {
      try {
        const { data } = await request.post(
          `${URL}/user/signup/invite/link`,
          { token },
          auth()
        );
        return data as
          | { linked: true; minecraftName: string; inviterName: string }
          | {
              linked: false;
              reason: 'invalid' | 'linked_elsewhere' | 'unavailable';
            };
      } catch (error) {
        return handleError(error);
      }
    },
    async requestGuardianConsent({
      guardianEmail,
      childFirstName,
      invite,
      birthYear,
      birthMonth
    }: {
      guardianEmail: string;
      childFirstName: string;
      invite: string;
      birthYear: number;
      birthMonth: number;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/user/signup/guardian-consent`,
          {
            guardianEmail,
            childFirstName,
            invite,
            birthYear,
            birthMonth,
            // the guardian email leads with Korean for a Korean browser
            language:
              (typeof navigator !== 'undefined' && navigator.language) || ''
          }
        );
        trackEvent('guardian_consent_request');
        return data as {
          consentId: number;
          secret: string;
          guardianEmail: string;
          expiresAt: number;
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async getGuardianConsentStatus({
      consentId,
      secret
    }: {
      consentId: number;
      secret: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/user/signup/guardian-consent/status`,
          { consentId, secret }
        );
        return data as {
          status: 'pending' | 'approved' | 'declined' | 'expired' | 'used';
          expiresAt: number;
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadGuardianConsentReview(token: string) {
      try {
        const { data } = await request.get(
          `${URL}/user/signup/guardian-consent/review?token=${encodeURIComponent(
            token
          )}`
        );
        return data as { consent: GuardianConsentView | null };
      } catch (error) {
        return handleError(error);
      }
    },
    async decideGuardianConsent({
      token,
      decision
    }: {
      token: string;
      decision: 'approve' | 'decline';
    }) {
      try {
        const { data } = await request.post(
          `${URL}/user/signup/guardian-consent/decision`,
          { token, decision }
        );
        trackEvent('guardian_consent_decision', { decision });
        return data as { consent: GuardianConsentView };
      } catch (error) {
        return handleError(error);
      }
    },
    async verifyPassphrase(passphrase: string) {
      try {
        const {
          data: { isMatch }
        } = await request.post(`${URL}/user/signup/passphrase`, { passphrase });
        return isMatch;
      } catch (error) {
        return handleError(error);
      }
    }
  };
}
