import React from 'react';
import { QueryClient, QueryClientProvider as RQProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export const AppQueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <RQProvider client={queryClient}>{children}</RQProvider>;
};

export default AppQueryProvider;
