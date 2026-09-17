import React from 'react';
import { NavigationTab } from '../types';

interface BottomNavProps {
  currentView: NavigationTab | string;
  onNavigate?: (view: NavigationTab) => void;
  onTabChange?: (view: NavigationTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onNavigate,
  onTabChange,
}) => {
  const handleTabClick = (tab: NavigationTab) => {
    if (onNavigate) {
      onNavigate(tab);
    }
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const navItems = [
    {
      id: 'editions' as NavigationTab,
      elementId: 'nav-tab-editions',
      label: 'Éditions',
      icon: 'collections_bookmark',
      title: 'Liste des éditions — changer ou créer',
    },
    {
      id: 'home' as NavigationTab,
      elementId: 'nav-tab-edition',
      label: 'Accueil',
      icon: 'dashboard',
      title: "Consulter l'accueil de l'édition",
    },
    {
      id: 'new' as NavigationTab,
      elementId: 'nav-tab-nouveau',
      label: 'Nouveau',
      icon: 'volunteer_activism',
      title: 'Enregistrer un nouveau don',
    },
    {
      id: 'kpi' as NavigationTab,
      elementId: 'nav-tab-kpis',
      label: 'KPIs',
      icon: 'analytics',
      title: 'Voir les statistiques et KPIs',
    },
    {
      id: 'close' as NavigationTab,
      elementId: 'nav-tab-cloture',
      label: 'Clôture',
      icon: 'history_edu',
      title: 'Clôture officielle et rapport de campagne',
    },
  ];

  return (
    <nav
      id="bottom-navigation"
      aria-label="Navigation principale de l'application"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe bg-[#f9f9ff]/95 backdrop-blur-xl border-t border-[#e7eeff] shadow-[0_-4px_20px_rgba(17,28,45,0.06)]"
    >
      <div className="max-w-xl sm:max-w-2xl md:max-w-3xl mx-auto grid grid-cols-5 items-center h-16 px-1 sm:px-6">
        {navItems.map((item) => {
          const isActive =
            currentView === item.id ||
            (item.id === 'home' && currentView === 'all-donations');
          return (
            <button
              key={item.id}
              id={item.elementId}
              type="button"
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center justify-center w-full h-14 rounded-xl transition-all duration-200 cursor-pointer select-none group active:scale-95 ${
                isActive
                  ? 'text-[#af101a] font-bold bg-[#ffdad6]/40'
                  : 'text-[#5b403d] hover:text-[#af101a] hover:bg-[#f0f3ff]'
              }`}
              title={item.title}
            >
              <span
                className={`material-symbols-outlined text-[22px] transition-transform duration-200 group-hover:scale-105 ${
                  isActive ? 'fill text-[#af101a]' : ''
                }`}
              >
                {item.icon}
              </span>
              <span
                className={`text-[11px] mt-0.5 tracking-tight ${
                  isActive ? 'font-bold text-[#af101a]' : 'font-medium'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#af101a] -mt-0.5"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
