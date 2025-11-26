import React from 'react';
import { Calculator, Menu } from 'lucide-react';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2 text-indigo-600">
              <Calculator size={28} />
              <span className="font-bold text-xl tracking-tight text-slate-900">EstimIA</span>
            </div>
          </div>
          <div className="flex items-center">
             <button className="p-2 rounded-md text-slate-400 hover:text-slate-500 focus:outline-none">
               <Menu size={24} />
             </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
