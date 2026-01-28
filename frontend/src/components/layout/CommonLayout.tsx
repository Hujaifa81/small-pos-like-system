import { Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';

interface IProps {
  children?: ReactNode;
}

export default function CommonLayout({ children }: IProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-800 text-white p-4">Small POS</header>
      <main className="flex-1 container mx-auto p-4">{children ?? <Outlet />}</main>
      <footer className="bg-slate-100 text-center p-4">© Small POS</footer>
    </div>
  );
}
