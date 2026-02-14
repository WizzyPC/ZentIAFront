import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useChatStore } from '../store/chatStore';

interface Props {
  children: ReactNode;
}

function ProtectedRoute({ children }: Props) {
  const user = useChatStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
