import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export const AccessRoute = ({
  children,
  module,
  action = 'read',
}: {
  children: ReactNode;
  module: string;
  action?: 'read' | 'write';
}) => {
  const can = useAuthStore((state) => state.can);
  const allowed = can(module, action);

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
