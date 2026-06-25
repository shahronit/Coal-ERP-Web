import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { canReadModule } from '../utils/permissions';

export default function ProtectedRoute({ children, module }) {
  const user = useSelector(selectCurrentUser);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Route access is permission-based (CRUD). Sidebar nav uses module matrix separately.
  if (module && !canReadModule(user.role, module)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
