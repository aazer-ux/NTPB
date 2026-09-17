import React from 'react';
import { UserSession, SyncState } from '../types';
import { APP_IMAGES, DEFAULT_USER } from '../data/initialData';
import { UserAvatar } from './UserAvatar';

interface HeaderProps {
  currentView?: string;
  title?: string;
  user?: UserSession;
  syncState?: SyncState;
  onProfileClick?: () => void;
  onOpenLogin?: () => void;
  onTitleClick?: () => void;
  onOpenImageManager: () => void;
  images?: typeof APP_IMAGES;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  title,
  user = DEFAULT_USER,
  syncState = 'idle',
  onProfileClick,
  onOpenLogin,
  onTitleClick,
  onOpenImageManager,
  images = APP_IMAGES,
}) => {
  const getTitle = () => {
    if (title) return title;
    switch (currentView) {
      case 'home':
        return 'Accueil Édition';
      case 'new':
        return 'Nouveau Don';
      case 'kpi':
        return 'Statistiques & KPI';
      case 'close':
        return 'Clôture Officielle';
      case 'login':
        return 'Espace Gestionnaire';
      default:
        return 'Noël pour Tous à Batcha';
    }
  };

  const logoSrc = images?.logoNTPB || APP_IMAGES.logoNTPB;
  const handleProfileClick = onProfileClick || onOpenLogin || (() => {});

  return (
    <header className="fixed top-0 w-full z-40 pt-safe bg-[#f9f9ff]/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#e7eeff] lg:pl-64">
      <div className="max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-5xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2">
        {/* Left: Mobile Branding / Desktop Breadcrumbs */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Mobile only logo button */}
          <button
            onClick={onOpenImageManager}
            title="Personnaliser les images dynamiques"
            className="lg:hidden w-10 h-10 rounded-xl bg-[#f0f3ff] hover:bg-[#e7eeff] border border-[#d8e3fb] flex items-center justify-center shadow-xs flex-shrink-0 relative group transition-all cursor-pointer"
          >
            <img
              src={logoSrc}
              alt="Logo NTPB"
              className="w-8 h-8 object-contain rounded-lg"
              onError={(e) => {
                // Fallback icon if custom image fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </div>
          </button>

          <div className="flex flex-col min-w-0">
            {/* Mobile subtitle & sync badge (état réel confirmé côté serveur) */}
            <div className="flex items-center gap-1.5 lg:hidden">
              <span className="text-[11px] uppercase tracking-wider text-[#af101a] font-bold">
                NTPB ADMIN
              </span>
              {syncState === 'synced' && (
                <span
                  title="Données confirmées sur le serveur Supabase"
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#a3f69c]/60 text-[#005312] text-[10px] leading-tight font-semibold"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1b6d24]"></span>
                  Sync Cloud
                </span>
              )}
              {syncState === 'syncing' && (
                <span
                  title="Synchronisation en cours..."
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#dee8ff] text-[#111c2d] text-[10px] leading-tight font-semibold"
                >
                  <span className="material-symbols-outlined text-[11px] leading-none animate-spin">sync</span>
                  Sync...
                </span>
              )}
              {syncState === 'error' && (
                <span
                  title="Synchronisation impossible — vérifiez votre connexion"
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a] text-[10px] leading-tight font-semibold"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]"></span>
                  Hors ligne
                </span>
              )}
            </div>

            {/* Desktop breadcrumb */}
            <div className="hidden lg:flex items-center gap-2 text-[12px] text-[#5b403d] font-medium mb-0.5">
              <span className="text-[#af101a] font-bold uppercase tracking-wider text-[11px]">
                Plateforme NTPB
              </span>
              <span>/</span>
              <span className="text-[#111c2d] font-semibold">Campagne Batcha</span>
            </div>

            <h1 className="text-[18px] sm:text-[20px] font-bold text-[#111c2d] truncate leading-tight">
              {onTitleClick && currentView !== 'login' && currentView !== 'editions' ? (
                <button
                  type="button"
                  onClick={onTitleClick}
                  title="Revenir à la liste des éditions"
                  className="flex items-center gap-1.5 max-w-full cursor-pointer group"
                >
                  <span className="truncate group-hover:text-[#af101a] transition-colors">
                    {getTitle()}
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-[#8f6f6c] group-hover:text-[#af101a] shrink-0">
                    swap_horiz
                  </span>
                </button>
              ) : (
                getTitle()
              )}
            </h1>
          </div>
        </div>

        {/* Right: User Identity (nom + téléphone) + Avatar profil */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="flex flex-col items-end pr-1 min-w-0 max-w-[150px] sm:max-w-[190px]">
            <span className="text-[11px] text-[#111c2d] font-semibold truncate">
              {user.isLoggedIn ? user.name : 'Invité — Consultation'}
            </span>
            <span className="text-[10px] text-[#5b403d] leading-none truncate">
              {user.isLoggedIn && user.phone ? `+237 ${user.phone}` : 'Gestionnaire NTPB'}
            </span>
          </div>

          <button
            onClick={handleProfileClick}
            title={user.isLoggedIn ? `Connecté: ${user.name} (Cliquez pour gérer)` : 'Se connecter'}
            className="flex items-center gap-1 p-0.5 rounded-full bg-[#dee8ff] hover:ring-2 hover:ring-[#af101a]/30 transition-all cursor-pointer relative"
          >
            <UserAvatar user={user} size="sm" />
            {user.isLoggedIn && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#1b6d24] border-2 border-white rounded-full"></span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
