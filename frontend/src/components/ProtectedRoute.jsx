// frontend/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredPermission = null }) => {
  const { user, checkPermission } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Special handling for group permissions - always allow admin users
  if ((requiredPermission === 'view_groups' || requiredPermission === 'manage_groups') && user.role === 'admin') {
    return children;
  }

  if (requiredPermission && !checkPermission(requiredPermission)) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;