export const extractConversationIdFromUrl = ({ url }: { url: string }): number | null => {
  const match = url.match(/conversations\/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

export const shouldApplyFilters = (
  conversation: any,
  filters: Record<string, string>,
): boolean => {
  const { status, inbox_id: inboxId } = filters || {};
  if (status && status !== 'all' && conversation?.status !== status) {
    return false;
  }
  if (inboxId && inboxId !== '0' && String(conversation?.inboxId) !== inboxId) {
    return false;
  }
  return true;
};

export const findPendingMessageIndex = (conversation: any, message: any): number => {
  const messages = conversation?.messages || [];
  return messages.findIndex(
    (existing: any) =>
      (message?.echoId && existing.echoId === message.echoId) || existing.id === message?.id,
  );
};
