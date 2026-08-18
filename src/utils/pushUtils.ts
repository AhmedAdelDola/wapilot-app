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
  // Stub - no push notifications yet
};
