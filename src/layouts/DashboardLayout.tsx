import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import HealthBadge from '../components/HealthBadge';

function DashboardLayout() {
  const [mobileSidebar, setMobileSidebar] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <div className="hidden w-80 lg:block">
        <Sidebar />
      </div>

      <div
        className={`fixed inset-0 z-20 bg-black/50 transition-opacity lg:hidden ${mobileSidebar ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setMobileSidebar(false)}
      >
        <div className={`h-full w-80 transition-transform ${mobileSidebar ? 'translate-x-0' : '-translate-x-full'}`} onClick={(event) => event.stopPropagation()}>
          <Sidebar />
        </div>
      </div>
      {mobileSidebar && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setMobileSidebar(false)}>
          <div className="h-full w-80" onClick={(event) => event.stopPropagation()}>
            <Sidebar />
          </div>
        </div>
      )}

      <main className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setMobileSidebar(true)} className="rounded-md border border-slate-700 p-2 text-slate-300 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileSidebar(true)}
              className="rounded-md border border-slate-700 p-2 text-slate-300 lg:hidden"
            >
              <Menu size={18} />
            </button>
            <h1 className="font-semibold tracking-wide text-cyan-300">Zent IA</h1>
            <HealthBadge />
          </div>
        </header>

        <div className="flex-1 px-4 py-4 transition-all duration-200 lg:px-8 lg:py-6">
        <div className="flex-1 px-4 py-4 lg:px-8 lg:py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
