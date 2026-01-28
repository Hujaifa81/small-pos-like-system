/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ComponentType, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { axiosInstance } from '../lib/axios';
import type { TRole } from '../types';



export const withAuth = (Component: ComponentType<any>, requiredRole?: TRole | TRole[]) => {
  return function AuthWrapper() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
      let mounted = true;
      axiosInstance
        .get('/user/me')
        .then((res) => {
          if (mounted) setUser(res.data?.data ?? null);
        })
        .catch(() => {
          if (mounted) setUser(null);
        })
        .finally(() => mounted && setLoading(false));
      return () => {
        mounted = false;
      };
    }, []);

    if (!loading && !user?.email) {
      return <Navigate to="/login" />;
    }

    if (requiredRole && !loading) {
      const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!allowed.includes(user?.role)) {
        return <Navigate to="/unauthorized" />;
      }
    }

    return <Component user={user} />;
  };
};

export default withAuth;
