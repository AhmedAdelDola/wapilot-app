import { combineReducers } from 'redux';

import authSlice from '@/viewmodels/store/auth/authSlice';
import settingsSlice from '@/viewmodels/store/settings/settingsSlice';
import conversationFilterSlice from '@/viewmodels/store/conversation/conversationFilterSlice';
import conversationSelectedSlice from '@/viewmodels/store/conversation/conversationSelectedSlice';
import conversationHeaderSlice from '@/viewmodels/store/conversation/conversationHeaderSlice';
import conversationActionSlice from '@/viewmodels/store/conversation/conversationActionSlice';
import conversationSlice from '@/viewmodels/store/conversation/conversationSlice';
import inboxSlice from '@/viewmodels/store/inbox/inboxSlice';
import labelReducer from '@/viewmodels/store/label/labelSlice';
import contactSlice from '@/viewmodels/store/contact/contactSlice';
import assignableAgentSlice from '@/viewmodels/store/assignable-agent/assignableAgentSlice';
import conversationTypingSlice from '@/viewmodels/store/conversation/conversationTypingSlice';
import notificationSlice from '@/viewmodels/store/notification/notificationSlice';
import notificationFilterSlice from '@/viewmodels/store/notification/notificationFilterSlice';
import sendMessageSlice from '@/viewmodels/store/conversation/sendMessageSlice';
import audioPlayerSlice from '@/viewmodels/store/conversation/audioPlayerSlice';
import teamSlice from '@/viewmodels/store/team/teamSlice';
import contactLabelSlice from '@/viewmodels/store/contact/contactLabelSlice';
import contactConversationSlice from '@/viewmodels/store/contact/contactConversationSlice';
import dashboardAppSlice from '@/viewmodels/store/dashboard-app/dashboardAppSlice';
import customAttributeSlice from '@/viewmodels/store/custom-attribute/customAttributeSlice';
import conversationParticipantSlice from '@/viewmodels/store/conversation-participant/conversationParticipantSlice';
import localRecordedAudioCacheSlice from '@/viewmodels/store/conversation/localRecordedAudioCacheSlice';

import cannedResponseSlice from '@/viewmodels/store/canned-response/cannedResponseSlice';
import macroSlice from '@/viewmodels/store/macro/macroSlice';
import searchSlice from '@/viewmodels/store/search/searchSlice';
import copilotSlice from '@/viewmodels/store/copilot/copilotSlice';

export const appReducer = combineReducers({
  auth: authSlice,
  settings: settingsSlice,
  conversationFilter: conversationFilterSlice,
  selectedConversation: conversationSelectedSlice,
  conversationHeader: conversationHeaderSlice,
  conversations: conversationSlice,
  conversationAction: conversationActionSlice,
  contacts: contactSlice,
  labels: labelReducer,
  inboxes: inboxSlice,
  assignableAgents: assignableAgentSlice,
  conversationTyping: conversationTypingSlice,
  notifications: notificationSlice,
  notificationFilter: notificationFilterSlice,
  sendMessage: sendMessageSlice,
  audioPlayer: audioPlayerSlice,
  teams: teamSlice,
  macros: macroSlice,
  contactLabels: contactLabelSlice,
  contactConversations: contactConversationSlice,
  dashboardApps: dashboardAppSlice,
  customAttributes: customAttributeSlice,
  conversationParticipants: conversationParticipantSlice,
  cannedResponses: cannedResponseSlice,
  localRecordedAudioCache: localRecordedAudioCacheSlice,
  search: searchSlice,
  copilot: copilotSlice,
});
