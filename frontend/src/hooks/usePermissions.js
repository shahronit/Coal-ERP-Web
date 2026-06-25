import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import {
  canReadModule,
  canWriteModule,
  canDeleteModule,
  getCrudAccess,
  hasPermission,
} from '../utils/permissions';

export function usePermissions() {
  const user = useSelector(selectCurrentUser);
  const role = user?.role;

  return useMemo(
    () => ({
      role,
      hasPermission: (permissionKey) => hasPermission(role, permissionKey),
      canReadModule: (module) => canReadModule(role, module),
      canWriteModule: (module) => canWriteModule(role, module),
      canDeleteModule: (module) => canDeleteModule(role, module),
    }),
    [role]
  );
}

export function useCrudAccess(module) {
  const user = useSelector(selectCurrentUser);
  const role = user?.role;

  return useMemo(() => getCrudAccess(role, module), [role, module]);
}
