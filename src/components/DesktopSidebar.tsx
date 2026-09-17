import React from 'react';
import { NavigationTab, Edition, UserSession } from '../types';
import { APP_IMAGES, DEFAULT_USER } from '../data/initialData';
import { UserAvatar } from './UserAvatar';

interface DesktopSidebarProps {
  currentView: NavigationTab | string;
  onNavigate: (tab: NavigationTab) => void;
  currentEdition?: Edition;
  donationsCount: number;
  user?: UserSession;
  onProfileClick: () => void;
  onOpenImageManager: () => void;
  images?: typeof APP_IMAGES;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  currentView,
  onNavigate,
  currentEdition,
  donationsCount,
  user = DEFAULT_USER,
  onProfileClick,
  onOpenImageManager,
  images = APP_IMAGES,
}) => {
  const logoSrc = images?.logoNTPB || APP_IMAGES.logoNTPB;

  const primaryNavItems = [
    {
      id: 'editions' as NavigationTab,
      elementId: 'desktop-nav-editions',
      label: 'Liste des Éditions',
      icon: 'collections_bookmark',
      description: 'Changer ou créer une édition',
    },
    {
      id: 'home' as NavigationTab,
      elementId: 'desktop-nav-edition',
      label: 'Accueil Édition',
      icon: 'dashboard',
      description: 'Vue d’ensemble & métriques',
    },
    {
      id: 'new' as NavigationTab,
      elementId: 'desktop-nav-nouveau',
      label: 'Nouveau Don',
      icon: 'volunteer_activism',
      description: 'Enregistrer une contribution',
    },
    {
      id: 'kpi' as NavigationTab,
      elementId: 'desktop-nav-kpis',
      label: 'Statistiques & KPI',
      icon: 'analytics',
      description: 'Graphiques & analyses',
    },
    {
      id: 'close' as NavigationTab,
      elementId: 'desktop-nav-cloture',
      label: 'Clôture Officielle',
      icon: 'history_edu',
      description: 'Rapport certifié & PDF',
    },
  ];

  const secondaryNavItems = [
    {
      id: 'all-donations' as NavigationTab,
      elementId: 'desktop-nav-all-donations',
      label: 'Tous les Dons',
      icon: 'receipt_long',
      badge: donationsCount > 0 ? donationsCount.toString() : undefined,
    },
  ];

  return (
    <aside
      id="desktop-sidebar"
      aria-label="Navigation latérale principale"
      className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-white border-r border-[#e7eeff] z-50 shadow-[2px_0_12px_rgba(17,28,45,0.03)] select-none"
    >
      {/* 1. Header: Logo & Branding */}
      <div className="p-4 border-b border-[#e7eeff] flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenImageManager}
          title="Personnaliser les visuels de l'application"
          className="relative w-11 h-11 rounded-xl bg-[#f0f3ff] hover:bg-[#e7eeff] border border-[#d8e3fb] flex items-center justify-center flex-shrink-0 group cursor-pointer transition-all"
        >
          <img
            src={logoSrc}
            alt="Logo NTPB"
            className="w-8 h-8 object-contain rounded-lg"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </div>
        </button>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#af101a]">
              NTPB ADMIN
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#a3f69c]/60 text-[#005312] text-[9px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1b6d24] animate-pulse" />
              Live
            </span>
          </div>
          <h2 className="text-[13px] font-bold text-[#111c2d] truncate">
            Noël Pour Tous
          </h2>
          <span className="text-[10px] text-[#5b403d] -mt-0.5">Batcha, Cameroun</span>
        </div>
      </div>

{/* 2. Active Edition Context Pill */}
      <button
        type="button"
        onClick={() => onNavigate('editions')}
        title="Revenir à la liste des éditions"
        className="p-3 bg-[#f0f3ff]/60 border-b border-[#e7eeff] text-left cursor-pointer hover:bg-[#dee8ff]/60 transition-colors w-full"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-[#5b403d] tracking-wider">
            {currentEdition ? 'Édition Active' : 'Éditions'}
          </span>
          {currentEdition && (
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap ${
                currentEdition.status === 'Clôturée'
                  ? 'bg-[#ffdfa0] text-[#261a00]'
                  : 'bg-[#a3f69c] text-[#002204]'
              }`}
            >
              {currentEdition.status === 'Clôturée' ? 'Clôturée' : 'En cours'}
            </span>
          )}
        </div>
        <p className="text-[12px] font-bold text-[#111c2d] truncate mt-0.5">
          {currentEdition ? currentEdition.name : 'Aucune édition ouverte'}
        </p>
        <p className="text-[10px] text-[#5b403d] truncate">
          {currentEdition ? currentEdition.theme : 'Cliquez pour créer ou en sélectionner une'}
        </p>
      </button>

      {/* 3. Navigation Links Container */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Primary Sections */}
        <div className="space-y-1">
          <span className="px-2 text-[10px] uppercase font-extrabold text-[#8f6f6c] tracking-wider">
            Navigation Principale
          </span>

          <div className="mt-1 space-y-1">
            {primaryNavItems.map((item) => {
              const isActive =
                currentView === item.id ||
                (item.id === 'home' && currentView === 'all-donations');
              return (
                <button
                  key={item.id}
                  id={item.elementId}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-[#ffdad6]/60 text-[#af101a] font-bold shadow-xs'
                      : 'text-[#5b403d] hover:bg-[#f0f3ff] hover:text-[#111c2d] font-medium'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] flex-shrink-0 ${
                      isActive ? 'fill text-[#af101a]' : ''
                    }`}
                  >
                    {item.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] block leading-tight truncate">
                      {item.label}
                    </span>
                    <span className="text-[10px] opacity-75 block truncate">
                      {item.description}
                    </span>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-4 rounded-full bg-[#af101a]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Views */}
        <div className="space-y-1">
          <span className="px-2 text-[10px] uppercase font-extrabold text-[#8f6f6c] tracking-wider">
            Registres & Historique
          </span>

          <div className="mt-1 space-y-1">
            {secondaryNavItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  id={item.elementId}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-[#ffdad6]/60 text-[#af101a] font-bold shadow-xs'
                      : 'text-[#5b403d] hover:bg-[#f0f3ff] hover:text-[#111c2d] font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`material-symbols-outlined text-[18px] flex-shrink-0 ${
                        isActive ? 'fill text-[#af101a]' : ''
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="text-[12px] truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-full bg-[#dee8ff] text-[#111c2d] text-[10px] font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Footer: User Session & Actions */}
      <div className="p-3 border-t border-[#e7eeff] space-y-2 bg-[#f9f9ff]">
        <button
          type="button"
          onClick={onProfileClick}
          className="w-full p-2 rounded-xl bg-white border border-[#e7eeff] hover:border-[#af101a]/40 shadow-xs flex items-center gap-2.5 text-left transition-all cursor-pointer group"
          title="Gérer le compte gestionnaire"
        >
          <UserAvatar
            user={user}
            size="md"
            className="border-[#dee8ff]"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-[#111c2d] truncate group-hover:text-[#af101a] transition-colors">
              {user.isLoggedIn ? user.name : 'Invité NTPB'}
            </p>
            <p className="text-[10px] text-[#5b403d] truncate">
              {user.isLoggedIn ? 'Comité Central • Connecté' : 'Gestionnaire'}
            </p>
          </div>
          <span className="material-symbols-outlined text-[18px] text-[#8f6f6c] group-hover:text-[#af101a]">
            chevron_right
          </span>
        </button>

        <div className="flex items-center justify-between px-1 text-[10px] text-[#8f6f6c]">
          <span>v4.2.0 • Responsive</span>
          <button
            type="button"
            onClick={onOpenImageManager}
            className="text-[#af101a] hover:underline font-semibold cursor-pointer"
          >
            Personnaliser visuels
          </button>
        </div>
      </div>
    </aside>
  );
};
