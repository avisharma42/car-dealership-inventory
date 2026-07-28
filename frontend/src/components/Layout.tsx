import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

export const Layout = ({ children }: { children: ReactNode }) => {
  const { user, isAdmin, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              AM
            </span>
            <span className="text-lg font-semibold tracking-tight">Apex Motors</span>
          </Link>

          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{user.name}</p>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {isAdmin ? 'Administrator' : 'Customer'}
                </p>
              </div>
              <button type="button" className="btn-secondary" onClick={logout}>
                Log out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
};
