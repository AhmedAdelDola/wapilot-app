// This listener adds the contacts to the store when there are new conversations are added to the store. It may be created in bulk or individually.

import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { conversationActions } from '../conversation/conversationActions';
import { notificationActions } from '../notification/notificationAction';
import { addNotification } from '../notification/notificationSlice';
import { addContact, addContacts } from './contactSlice';
import { Conversation } from '@/models/types/Conversation';
import { Notification } from '@/models/types/Notification';

export const contactListenerMiddleware = createListenerMiddleware();

contactListenerMiddleware.startListening({
  matcher: isAnyOf(conversationActions.fetchConversations.fulfilled),
  effect: (action, listenerApi) => {
    const { payload } = action as unknown as { payload: { conversations: Conversation[] } };
    const { conversations } = payload;
    const contacts = conversations.map((conversation: Conversation) => conversation.meta.sender);
    if (contacts.length > 0) {
      listenerApi.dispatch(addContacts({ contacts }));
    }
  },
});

contactListenerMiddleware.startListening({
  matcher: isAnyOf(conversationActions.fetchConversation.fulfilled),
  effect: (action, listenerApi) => {
    const conversation = (action as unknown as { payload: Conversation }).payload;
    const contact = conversation?.meta?.sender;
    if (contact) {
      listenerApi.dispatch(addContact(contact));
    }
  },
});

contactListenerMiddleware.startListening({
  matcher: isAnyOf(notificationActions.fetchNotifications.fulfilled),
  effect: (action, listenerApi) => {
    const { payload: notifications } = (
      action as unknown as { payload: { payload: Notification[] } }
    ).payload;
    const conversationNotifications = notifications.filter(
      (notification: Notification) =>
        notification.primaryActorType === 'Conversation' && notification.primaryActor?.meta?.sender,
    );
    const contacts = conversationNotifications.map(
      (notification: Notification) => notification.primaryActor?.meta?.sender,
    );
    if (contacts.length > 0) {
      listenerApi.dispatch(addContacts({ contacts }));
    }
  },
});

contactListenerMiddleware.startListening({
  matcher: isAnyOf(addNotification),
  effect: (action, listenerApi) => {
    const { payload } = action as unknown as { payload: { notification: Notification } };
    const { notification } = payload;
    const contact = notification?.primaryActor?.meta?.sender;
    if (contact) {
      listenerApi.dispatch(addContact(contact));
    }
  },
});
