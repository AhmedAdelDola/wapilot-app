export const checkServerSupport = ({
  installedVersion,
  userRole,
}: {
  installedVersion: string;
  userRole?: string;
}) => {
  console.log('[ServerCheck] Version:', installedVersion, 'Role:', userRole);
};
