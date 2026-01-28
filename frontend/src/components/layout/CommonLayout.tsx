import { Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';

interface IProps {
  children?: ReactNode;
}

export default function CommonLayout({ children }: IProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto p-4">{children ?? <Outlet />}</main>
    </div>
  );
}
