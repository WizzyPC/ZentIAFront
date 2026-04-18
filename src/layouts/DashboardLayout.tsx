import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import HealthBadge from '../components/HealthBadge';
import Sidebar from '../components/Sidebar';

function DashboardLayout() {
  const [mobileSidebar, setMobileSidebar] = useState(false);

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top,_#1e293b,_#020617_55%)] text-slate-100">
      <div className="hidden w-80 lg:block">
        <Sidebar />
      </div>

      <div
        className={`fixed inset-0 z-20 bg-black/60 transition-opacity lg:hidden ${
          mobileSidebar ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMobileSidebar(false)}
      >
        <div
          className={`h-full w-80 transition-transform ${
            mobileSidebar ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <Sidebar />
        </div>
      </div>

      <main className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-indigo-500/20 bg-slate-950/70 px-4 py-3 backdrop-blur-xl lg:px-8">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMobileSidebar(true)}
              className="rounded-md border border-slate-700 p-2 text-slate-300 lg:hidden"
            >
              <Menu size={18} />
            </button>
            <h1 className="bg-gradient-to-r from-cyan-300 to-indigo-300 bg-clip-text font-semibold tracking-wide text-transparent">
              Zent IA Studio
            </h1>
            <HealthBadge />
          </div>
        </header>

        <div className="flex-1 px-4 py-4 lg:px-8 lg:py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
