import type { ReactNode } from 'react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export const AuthLayout = ({ title, subtitle, children }: AuthLayoutProps) => (
  <div className="grid min-h-screen lg:grid-cols-2">
    <div className="hidden flex-col justify-between bg-brand-700 p-12 text-white lg:flex">
      <span className="text-lg font-semibold tracking-tight">Apex Motors</span>
      <div>
        <h1 className="text-4xl font-bold leading-tight">Dealership inventory, in real time.</h1>
        <p className="mt-4 max-w-md text-brand-100">
          Track stock, search the lot by make, model, category and price, and buy with confidence — stock
          levels update the moment a sale goes through.
        </p>
      </div>
      <p className="text-sm text-brand-200">© {new Date().getFullYear()} Apex Motors</p>
    </div>

    <div className="flex items-center justify-center p-6 sm:p-12">
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <p className="mb-8 mt-1 text-sm text-slate-600">{subtitle}</p>
        {children}
      </div>
    </div>
  </div>
);
