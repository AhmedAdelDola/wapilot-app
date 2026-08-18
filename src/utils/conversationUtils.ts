export const extractConversationIdFromUrl = ({ url }: { url: string }): number | null => {
  const match = url.match(/conversations\/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
};
