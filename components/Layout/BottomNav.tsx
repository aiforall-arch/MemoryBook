import React from 'react';
import { Home, Compass, BookOpen, User, Plus } from 'lucide-react';
import { ViewState } from '../../types';

interface BottomNavProps {
    currentView: ViewState;
    onChangeView: (view: ViewState) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChangeView }) => {
    const navItems = [
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'explore', icon: Compass, label: 'Explore' },
        { id: 'upload', icon: Plus, label: 'Add', isSpecial: true },
        { id: 'stories', icon: BookOpen, label: 'Stories' },
        { id: 'profile', icon: User, label: 'Profile' },
    ];

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 pointer-events-none">
            <div className="max-w-md mx-auto glass-panel border border-white/10 rounded-3xl flex items-center justify-around p-2 pointer-events-auto shadow-2xl shadow-indigo-500/10">
                {navItems.map((item) => {
                    const isActive = currentView === item.id;

                    if (item.isSpecial) {
                        return (
                            <button
                                key={item.id}
                                onClick={() => onChangeView('upload')}
                                aria-label="Add Memory"
                                className="relative -top-8 w-14 h-14 bg-gradient-to-tr from-purple-500 via-indigo-500 to-cyan-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-purple-500/40 border-4 border-[#0B0F1A] hover:scale-110 active:scale-95 transition-all duration-300"
                            >
                                <item.icon size={28} strokeWidth={2.5} />
                            </button>
                        );
                    }

                    return (
                        <button
                            key={item.id}
                            onClick={() => onChangeView(item.id as ViewState)}
                            className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${isActive ? 'text-purple-400' : 'text-gray-400'
                                }`}
                        >
                            <item.icon
                                size={22}
                                className={`transition-all duration-300 ${isActive ? 'scale-110' : 'opacity-70'}`}
                            />
                            <span className="text-[10px] font-medium mt-1 uppercase tracking-tighter">
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
