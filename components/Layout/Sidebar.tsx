import React from 'react';
import { Home, Compass, Users, User, PlusCircle, LogOut } from 'lucide-react';
import { ViewState } from '../../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onLogout }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-20 lg:w-64 glass-panel border-r border-white/5 z-40 flex flex-col justify-between py-8">
      
      {/* Logo Area */}
      <div className="flex flex-col items-center lg:items-start px-0 lg:px-8 mb-8">
        <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 mb-2">
          <span className="text-white font-bold text-xl">M</span>
        </div>
        <h1 className="hidden lg:block text-xl font-bold tracking-tight text-white">
          Memory<span className="text-purple-400">Book</span>
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-4 px-3 lg:px-6">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id as ViewState)}
              className={`
                flex items-center gap-4 p-3 rounded-xl transition-all duration-300 group
                ${isActive 
                  ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30' 
                  : 'hover:bg-white/5 text-gray-400 hover:text-white'}
              `}
            >
              <div className={`
                p-2 rounded-full transition-all duration-300
                ${isActive ? 'bg-gradient-to-br from-purple-500 to-cyan-500 text-white shadow-lg shadow-purple-500/30' : 'bg-white/5 group-hover:bg-white/10'}
              `}>
                <item.icon size={20} />
              </div>
              <span className={`hidden lg:block font-medium ${isActive ? 'text-white' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Create Button (Special) */}
        <button
          onClick={() => onChangeView('upload')}
          className="mt-4 flex items-center gap-4 p-3 rounded-xl hover:scale-105 transition-all duration-300 group"
        >
          <div className="p-2 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-lg shadow-pink-500/30">
            <PlusCircle size={20} />
          </div>
          <span className="hidden lg:block font-medium text-white group-hover:neon-text">
            Add Memory
          </span>
        </button>
      </nav>

      {/* Footer / Logout */}
      <div className="px-3 lg:px-6">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-4 p-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <div className="p-2 rounded-full bg-white/5">
            <LogOut size={20} />
          </div>
          <span className="hidden lg:block font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};
