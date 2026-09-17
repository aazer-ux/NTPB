import React from 'react';
import { Edition } from '../types';
import { APP_IMAGES } from '../data/initialData';
import { formatFCFA } from '../utils/format';

interface EditionsListViewProps {
  editions: Edition[];
  currentEditionId: string;
  isLoggedIn: boolean;
  onOpenEdition: (id: string) => void;
  onOpenCreateModal: () => void;
}

const statusStyles: Record<Edition['status'], string> = {
  'En cours': 'bg-[#a3f69c] text-[#002204]',
  Clôturée: 'bg-[#ffdfa0] text-[#261a00]',
  Planifiée: 'bg-[#dee8ff] text-[#111c2d]',
};

const statusLabels: Record<Edition['status'], string> = {
  'En cours': 'En cours',
  Clôturée: 'Clôturée',
  Planifiée: 'Planifiée',
};

const statusOrder: Record<Edition['status'], number> = {
  'En cours': 0,
  Clôturée: 1,
  Planifiée: 2,
};

const formatShortDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatRangeDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

export const EditionsListView: React.FC<EditionsListViewProps> = ({
  editions,
  currentEditionId,
  isLoggedIn,
  onOpenEdition,
  onOpenCreateModal,
}) => {
  const sorted = [...editions].sort(
    (a, b) => statusOrder[a.status] - statusOrder[b.status]
  );

  return (
    <div className="flex flex-col w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 pb-28 lg:pb-12 pt-2">
      {/* En-tête de l'écran */}
      <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-white shadow-sm border border-[#e7eeff]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-[#ffdad6] flex items-center justify-center text-[#af101a]">
              <span className="material-symbols-outlined text-[20px]">collections_bookmark</span>
            </span>
            <h1 className="text-[18px] sm:text-[20px] font-extrabold text-[#111c2d] leading-tight">
              Liste des Éditions
            </h1>
          </div>
          <p className="text-[12px] text-[#5b403d] mt-1">
            {editions.length > 0
              ? `${editions.length} ${editions.length > 1 ? 'éditions créées' : 'édition créée'} — cliquez pour ouvrir`
              : 'Aucune édition pour le moment'}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="h-11 px-4 rounded-full bg-[#af101a] hover:bg-[#d32f2f] text-white font-bold text-[12px] sm:text-[13px] shadow-md flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Créer une édition</span>
        </button>
      </div>

      {/* Mode consultation : les actions de modification requièrent la connexion */}
      {!isLoggedIn && (
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#ffdfa0]/40 border border-[#715300]/30">
          <span className="material-symbols-outlined text-[#715300] text-[20px] flex-shrink-0">
            visibility
          </span>
          <p className="text-[12px] text-[#261a00] font-semibold leading-snug">
            Mode consultation : vous pouvez parcourir les éditions et les dons librement. La
            création et toute modification nécessitent la connexion gestionnaire.
          </p>
        </div>
      )}

      {/* Aucune édition : invitation à créer la première */}
      {sorted.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm border border-[#e7eeff]">
          <div className="relative overflow-hidden">
            <img
              src={APP_IMAGES.banner2026}
              alt="Enfants de Batcha"
              className="w-full h-36 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 flex items-center gap-2.5">
              <img
                src={APP_IMAGES.logoNTPB}
                alt="Logo NTPB"
                className="w-10 h-10 rounded-full object-cover border-2 border-white/80 shadow"
              />
              <div>
                <p className="text-[13px] font-extrabold text-white leading-tight">
                  Noël pour Tous à Batcha
                </p>
                <p className="text-[11px] text-white/80 font-medium">
                  Campagnes solidaires dans les villages des hauts plateaux
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            <div className="text-center space-y-1.5">
              <h2 className="text-[18px] sm:text-[20px] font-extrabold text-[#111c2d] leading-tight">
                Lancez votre première campagne
              </h2>
              <p className="text-[13px] text-[#5b403d] leading-relaxed">
                Aucune édition n'existe encore. Créez votre première édition de Noël pour
                commencer à enregistrer les dons et suivre la trésorerie en toute transparence.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenCreateModal}
              className="w-full h-13 rounded-full bg-[#af101a] hover:bg-[#d32f2f] text-white font-bold text-[14px] shadow-[0_6px_20px_rgba(175,16,26,0.25)] flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
              <span>{isLoggedIn ? 'Créer ma première édition' : 'Se connecter pour créer une édition'}</span>
            </button>

            <p className="text-[11px] text-[#8f6f6c] text-center">
              La gestion des dons, des promesses et des rapports officiels s'active dès la
              création de votre première édition.
            </p>
          </div>
        </div>
      ) : (
        /* Liste des éditions réelles stockées */
        <div className="flex flex-col gap-3">
          {sorted.map((edition) => {
            const progressPct =
              edition.budgetGoal > 0
                ? Math.min(100, Math.round(((edition.achievedAmount || 0) / edition.budgetGoal) * 100))
                : 0;
            const isCurrent = edition.id === currentEditionId;
            return (
              <button
                key={edition.id}
                type="button"
                onClick={() => onOpenEdition(edition.id)}
                title={`Ouvrir ${edition.name}`}
                className="text-left w-full p-4 rounded-2xl bg-white shadow-sm border border-[#e7eeff] hover:border-[#af101a]/40 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a] text-[10px] font-bold">
                        {edition.editionNumber}ᵉ Édition
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusStyles[edition.status]}`}
                      >
                        {statusLabels[edition.status]}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full bg-[#dee8ff] text-[#111c2d] text-[10px] font-bold">
                          Ouverte
                        </span>
                      )}
                    </div>
                    <span className="text-[15px] font-extrabold text-[#111c2d] truncate mt-1.5 group-hover:text-[#af101a] transition-colors">
                      {edition.name}
                    </span>
                    <span className="text-[12px] text-[#5b403d] truncate mt-0.5">
                      {edition.theme}
                    </span>
                    <span className="text-[11px] text-[#8f6f6c] mt-1">
                      {formatRangeDate(edition.startDate)} → {formatRangeDate(edition.endDate)}
                      {edition.startDate && edition.endDate
                        ? ` ${new Date(edition.endDate).getFullYear()}`
                        : ''}
                    </span>
                  </div>
                  <span className="w-9 h-9 rounded-full bg-[#f0f3ff] group-hover:bg-[#ffdad6] group-hover:text-[#af101a] text-[#8f6f6c] flex items-center justify-center flex-shrink-0 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </span>
                </div>

                {edition.budgetGoal > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#1b6d24]">
                        {formatFCFA(edition.achievedAmount || 0)} FCFA encaissés
                      </span>
                      <span className="text-[#5b403d]">
                        objectif {formatFCFA(edition.budgetGoal)} FCFA ({progressPct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#f0f3ff] mt-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#1b6d24] transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(progressPct, 1))}%` }}
                      />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};