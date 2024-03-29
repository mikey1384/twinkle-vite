import { useContextSelector } from 'use-context-selector';
import { AppContext } from './AppContext';
import { ChatContext } from './Chat';
import { ContentContext } from './Content';
import { ExploreContext } from './Explore';
import { HomeContext } from './Home';
import { InputContext } from './Input';
import { InteractiveContext } from './Interactive';
import { ManagementContext } from './Management';
import { NotiContext } from './Notification';
import { ProfileContext } from './Profile';
import { MissionContext } from './Mission';
import { ViewContext } from './View';
import { KeyContext } from './KeyContext';

export function useAppContext(fn: (value: any) => any) {
  return useContextSelector(AppContext, fn);
}
export function useChatContext(fn: (value: any) => any) {
  return useContextSelector(ChatContext, fn);
}
export function useContentContext(fn: (value: any) => any) {
  return useContextSelector(ContentContext, fn);
}
export function useExploreContext(fn: (value: any) => any) {
  return useContextSelector(ExploreContext, fn);
}
export function useHomeContext(fn: (value: any) => any) {
  return useContextSelector(HomeContext, fn);
}
export function useInputContext(fn: (value: any) => any) {
  return useContextSelector(InputContext, fn);
}
export function useInteractiveContext(fn: (value: any) => any) {
  return useContextSelector(InteractiveContext, fn);
}
export function useManagementContext(fn: (value: any) => any) {
  return useContextSelector(ManagementContext, fn);
}
export function useNotiContext(fn: (value: any) => any) {
  return useContextSelector(NotiContext, fn);
}
export function useProfileContext(fn: (value: any) => any) {
  return useContextSelector(ProfileContext, fn);
}
export function useMissionContext(fn: (value: any) => any) {
  return useContextSelector(MissionContext, fn);
}
export function useViewContext(fn: (value: any) => any) {
  return useContextSelector(ViewContext, fn);
}

export function useKeyContext(fn: (value: any) => any) {
  return useContextSelector(KeyContext, fn);
}
