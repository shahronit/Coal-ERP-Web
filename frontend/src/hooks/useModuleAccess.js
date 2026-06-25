import { useMemo } from 'react';
import { useGetAppSettingsQuery } from '../store/api/services';
import { buildCanAccess } from '../utils/roles';

export function useModuleAccess() {
  const { data } = useGetAppSettingsQuery();
  const settings = data?.data || {};

  const canAccess = useMemo(
    () => buildCanAccess(settings.roleModules, settings.crmEnabled !== false),
    [settings.roleModules, settings.crmEnabled]
  );

  return {
    canAccess,
    roleModules: settings.roleModules,
    defaultRoleModules: settings.defaultRoleModules,
    crmEnabled: settings.crmEnabled !== false,
    appName: settings.appName,
    companyName: settings.companyName,
    companyLogo: settings.companyLogo,
  };
}
