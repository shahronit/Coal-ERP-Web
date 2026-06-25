import ProtectedRoute from './ProtectedRoute';

export default function AppRoute({ module, children }) {
  return <ProtectedRoute module={module}>{children}</ProtectedRoute>;
}
