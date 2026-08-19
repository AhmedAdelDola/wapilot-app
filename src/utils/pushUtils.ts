import notifee from '@notifee/react-native';

export const findNotificationFromFCM = ({ message }: { message: any }) => {
  return message?.data || {};
};

export const findConversationLinkFromPush = ({
  notification,
  installationUrl,
}: {
  notification: any;
  installationUrl: string;
}) => {
  const conversationId = notification?.conversation_id;
  if (conversationId) {
    return `${installationUrl}/app/accounts/${notification.account_id}/conversations/${conversationId}`;
  }
  return null;
};

export const clearAllDeliveredNotifications = async () => {
  try {
    await notifee.cancelAllNotifications();
  } catch {
    // Ignore errors on platforms that don't support this
  }
};

export const updateBadgeCount = ({ count }: { count: number }) => {
  if (count === undefined) return;
  try {
    notifee.setBadgeCount(count);
  } catch {
    // Ignore errors on platforms that don't support this
  }
};
