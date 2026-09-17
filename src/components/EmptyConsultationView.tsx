import React from 'react';

interface EmptyConsultationViewProps {
  currentView: string;
  isLoggedIn: boolean;
  onGoToEditions: () => void;
  onOpenCreateEdition: () => void;
}

const contentByView: Record<string, { icon: string; title: string; message: string }> = {
  home: {
    icon: 'dashboard',
    title: 'Accueil Édition',
    message:
      "Aucune édition ni don n'existent encore. Cette page affichera la trésorerie réelle, les promesses et le budget dès la création d'une édition.",
  },
  kpi: {
    icon: 'analytics',
    title: 'Statistiques & KPI',
    message:
      'Aucune donnée pour le moment. Les graphiques, classements et jauges s’activeront dès la création d’une édition et l’enregistrement des dons.',
  },
  close: {
    icon: 'history_edu',
    title: 'Clôture Officielle',
    message:
      'Aucune donnée à synthétiser pour le moment. Le rapport officiel sera générable dès qu’une édition aura enregistré des dons.',
  },
  'all-donations': {
    icon: 'receipt_long',
    title: 'Tous les Dons',
    message: 'Aucun don à afficher pour le moment.',
  },
  new: {
    icon: 'volunteer_activism',
    title: 'Nouveau Don',
    message:
      'Aucune édition à laquelle rattacher un don. Créez d’abord une édition pour pouvoir enregistrer des contributions.',
  },
};

export const EmptyConsultationView: React.FC<EmptyConsultationViewProps> = ({
  currentView,
  isLoggedIn,
  onGoToEditions,
  onOpenCreateEdition,
}) => {
  const content = contentByView[currentView] || {
    icon: 'info',
    title: 'Aucune donnée',
    message: 'Aucune donnée enregistrée pour le moment.',
  };

  return (
    <div className="flex flex-col w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 pb-28 lg:pb-12 pt-2">
      <div className="flex flex-col items-center text-center pt-8 pb-4">
        <div className="w-14 h-14 rounded-2xl bg-[#ffdad6] flex items-center justify-center text-[#af101a] mb-3">
          <span className="material-symbols-outlined text-[30px]">{content.icon}</span>
        </div>
        <h1 className="text-[20px] sm:text-[22px] font-extrabold text-[#111c2d] leading-tight">
          {content.title}
        </h1>
        <p className="text-[13px] text-[#5b403d] mt-1.5 max-w-md leading-relaxed">
          {content.message}
        </p>
      </div>

      {/* Aperçu à zéro pour l'accueil */}
      {currentView === 'home' && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Encaissés', value: '0 FCFA', color: 'text-[#1b6d24]' },
            { label: 'Promesses', value: '0 FCFA', color: 'text-[#715300]' },
            { label: 'Dons', value: '0', color: 'text-[#af101a]' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl bg-white p-3.5 shadow-sm border border-[#e7eeff] text-center"
            >
              <span className={`text-[16px] sm:text-[18px] font-extrabold block ${stat.color}`}>
                {stat.value}
              </span>
              <span className="text-[11px] text-[#5b403d] font-medium">{stat.label}</span>
            </div>
          ))}
        </div>
      )}

      {currentView === 'home' && (
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-[#e7eeff]">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="font-bold text-[#5b403d]">Progression vers l'objectif</span>
            <span className="text-[#5b403d]">0 %</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#f0f3ff] overflow-hidden">
            <div className="h-full rounded-full bg-[#1b6d24]" style={{ width: '0%' }} />
          </div>
        </div>
      )}

      {!isLoggedIn && (
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#ffdfa0]/40 border border-[#715300]/30">
          <span className="material-symbols-outlined text-[#715300] text-[20px] flex-shrink-0">
            visibility
          </span>
          <p className="text-[12px] text-[#261a00] font-semibold leading-snug">
            Mode consultation : navigation libre. Seules les actions qui créent, modifient ou
            suppriment des données demandent la connexion gestionnaire.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={onGoToEditions}
          className="h-12 px-5 rounded-full bg-[#f0f3ff] hover:bg-[#dee8ff] text-[#111c2d] font-bold text-[13px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">collections_bookmark</span>
          <span>Voir les éditions</span>
        </button>
        <button
          type="button"
          onClick={onOpenCreateEdition}
          className="h-12 px-5 rounded-full bg-[#af101a] hover:bg-[#d32f2f] text-white font-bold text-[13px] flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>{isLoggedIn ? 'Créer une édition' : 'Se connecter pour créer une édition'}</span>
        </button>
      </div>
    </div>
  );
};