export const getUserPermissions = (user: any, accountId?: number | null): string[] => {
  if (!user?.accounts) return [];
  const account = user.accounts.find((a: any) => a.id === accountId);
  return account?.permissions || [];
};

export const CONVERSATION_PERMISSIONS = [
  'conversation_create',
  'conversation_manage',
  'conversation_view',
];
