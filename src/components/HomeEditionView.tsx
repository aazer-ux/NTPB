import React, { useMemo } from 'react';
import { Donation, Edition } from '../types';
import { DonationActionMenu } from './DonationActionMenu';
import { APP_IMAGES } from '../data/initialData';
import { formatCompactFCFA } from '../utils/format';

interface HomeEditionViewProps {
  currentEdition: Edition;
  donations: Donation[];
  onNavigate: (view: string) => void;
  onOpenImageManager: () => void;
  onToggleDonationStatus: (donation: Donation) => void;
  onEditDonation: (donation: Donation) => void;
  onDeleteDonation: (donationId: string) => void;
  images?: typeof APP_IMAGES;
}

export const HomeEditionView: React.FC<HomeEditionViewProps> = ({
  currentEdition,
  donations,
  onNavigate,
  onOpenImageManager,
  onToggleDonationStatus,
  onEditDonation,
  onDeleteDonation,
  images = APP_IMAGES,
}) => {

  // Compute live financial totals from donations
  const receivedTotal = useMemo(() => {
    return donations
      .filter((d) => d.status === 'Reçu')
      .reduce((acc, d) => acc + d.amount, 0);
  }, [donations]);

  const promisesTotal = useMemo(() => {
    return donations
      .filter((d) => d.status === 'Promesse')
      .reduce((acc, d) => acc + d.amount, 0);
  }, [donations]);

  const promisesCount = useMemo(() => {
    return donations.filter((d) => d.status === 'Promesse').length;
  }, [donations]);

  const targetBudget = currentEdition.budgetGoal || 0;
  const progressPercent =
    targetBudget > 0 ? Math.min(100, Math.round((receivedTotal / targetBudget) * 100)) : 0;

  // 5 Derniers dons
  const latestDonations = useMemo(() => {
    return donations.slice(0, 5);
  }, [donations]);

  // Helper for initials
  const getInitials = (name: string) => {
    if (name.toLowerCase().includes('anonyme')) return null;
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  return (
    <div className="flex flex-col w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-5 lg:space-y-6 pb-24 lg:pb-12 pt-2">
      {/* Édition En Cours - Festive Campaign Card */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(175,16,26,0.08),0_1px_3px_rgba(0,0,0,0.02)] border border-[#e7eeff]">
        {/* Soft background accents */}
        <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-[#ffdad6]/30 blur-2xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-28 h-28 rounded-full bg-[#a3f69c]/30 blur-xl pointer-events-none" />

        <div className="relative flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-xs ${
                  currentEdition.status === 'Clôturée'
                    ? 'bg-[#ffdfa0] text-[#261a00]'
                    : 'bg-[#a3f69c] text-[#002204]'
                }`}
              >
                {currentEdition.status === 'Clôturée' ? (
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-[#1b6d24] animate-ping" />
                )}
                {currentEdition.status === 'Clôturée' ? 'Clôturée' : 'En cours'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#dee8ff] text-[#5b403d] text-[11px] font-semibold">
                {currentEdition.editionNumber}ᵉ Édition
              </span>
            </div>

            {/* Compte à rebours */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ffdad6] text-[#410003] text-[11px] font-bold">
              <span className="material-symbols-outlined text-[15px] text-[#af101a]">
                hourglass_bottom
              </span>
              <span>J-28 avant Noël</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-[#af101a]">
              <span className="material-symbols-outlined text-[18px]">celebration</span>
              <span className="text-[13px] uppercase tracking-wide font-bold">
                {currentEdition.name}
              </span>
            </div>
            <h2 className="text-[20px] sm:text-[22px] font-bold text-[#111c2d] leading-snug mt-0.5">
              {currentEdition.theme}
            </h2>
            <div className="flex items-center gap-1.5 mt-1.5 text-[#5b403d]">
              <span className="material-symbols-outlined text-[16px]">calendar_month</span>
              <p className="text-[13px] font-medium">01 Nov 2026 → 25 Déc 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid for Financials and Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 lg:gap-6">
        {/* Left Column (Desktop 7 cols): Trésorerie Réelle & Bento Stats */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-5">
          {/* Barre de progression financière stricte */}
          <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-[0_4px_16px_-4px_rgba(27,109,36,0.08),0_1px_3px_rgba(0,0,0,0.03)] border border-[#e7eeff] space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#1b6d24] text-[18px]">
                    verified
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-[#1b6d24] font-bold">
                    Trésorerie Réelle
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[28px] sm:text-[32px] text-[#111c2d] font-extrabold tracking-tight leading-none">
                    {formatNumber(receivedTotal)}
                  </span>
                  <span className="text-[13px] text-[#5b403d] font-bold">FCFA</span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[11px] text-[#5b403d] font-semibold">Budget Cible</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-[18px] sm:text-[20px] text-[#111c2d] font-bold">
                    {formatNumber(targetBudget)}
                  </span>
                  <span className="text-[11px] text-[#5b403d]">FCFA</span>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 mt-0.5 rounded-full bg-[#a3f69c] text-[#002204] text-[11px] font-extrabold">
                  {progressPercent}%
                </span>
              </div>
            </div>

            {/* Animated Horizontal Goal Gauge */}
            <div className="relative w-full pt-1.5 pb-0.5">
              <div className="h-3.5 w-full bg-[#e7eeff] rounded-full overflow-hidden flex">
<div
                className="h-full bg-gradient-to-r from-[#1b6d24] via-[#217128] to-[#f8bd2a] rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-1"
                style={{ width: `${receivedTotal > 0 && targetBudget > 0 ? Math.max(5, progressPercent) : 0}%` }}
              >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                </div>
              </div>
              <div className="flex justify-between items-center mt-1 text-[11px] text-[#5b403d] font-medium">
                <span>0 FCFA</span>
                <span className="font-bold text-[#111c2d]">
                  {formatNumber(targetBudget)} FCFA
                </span>
              </div>
            </div>

            {/* Strict Transparency Notice */}
            <div className="rounded-xl bg-[#f0f3ff] p-3 flex items-start gap-2.5 border border-[#d8e3fb]">
              <span className="material-symbols-outlined text-[#af101a] text-[18px] flex-shrink-0 mt-0.5">
                shield
              </span>
              <p className="text-[12px] leading-relaxed text-[#5b403d]">
                <strong className="text-[#111c2d] font-semibold">Règle de sincérité financière :</strong>{' '}
                Seuls les fonds <span className="text-[#1b6d24] font-bold">réellement encaissés</span>{' '}
                sont comptabilisés dans la jauge.{' '}
                <span className="text-[#715300] font-semibold">
                  {formatNumber(promisesTotal)} FCFA
                </span>{' '}
                de promesses restent en attente de validation bancaire ou physique.
              </p>
            </div>
          </div>

          {/* Statistiques Rapides Bento */}
          <div className="grid grid-cols-2 gap-3">
            {/* Stat 1: Encaissé */}
            <div className="rounded-2xl bg-white p-3.5 sm:p-4 shadow-sm border border-[#e7eeff] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-[#a3f69c] flex items-center justify-center text-[#002204]">
                  <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-[#1b6d24] px-1.5 py-0.5 rounded bg-[#a3f69c]/50">
                  Sécurisé
                </span>
              </div>
              <div className="mt-2.5">
                <span className="text-[18px] sm:text-[20px] text-[#111c2d] font-extrabold block leading-tight">
                  {formatCompactFCFA(receivedTotal)}
                </span>
                <span className="text-[11px] text-[#5b403d] font-medium">FCFA Encaissés</span>
              </div>
            </div>

            {/* Stat 2: Promesses en attente */}
            <div className="rounded-2xl bg-white p-3.5 sm:p-4 shadow-sm border border-[#e7eeff] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-[#ffdfa0] flex items-center justify-center text-[#261a00]">
                  <span className="material-symbols-outlined text-[20px]">pending_actions</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-[#715300] px-1.5 py-0.5 rounded bg-[#ffdfa0]/60">
                  {promisesCount} dons
                </span>
              </div>
              <div className="mt-2.5">
                <span className="text-[18px] sm:text-[20px] text-[#111c2d] font-extrabold block leading-tight">
                  {formatNumber(promisesTotal)}
                </span>
                <span className="text-[11px] text-[#5b403d] font-medium">FCFA en Promesses</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Desktop 5 cols): 5 Derniers Dons & CTA */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          {/* Section: 5 Derniers Dons */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#af101a] text-[20px]">
                  receipt_long
                </span>
                <h3 className="text-[18px] text-[#111c2d] font-bold">5 Derniers Dons</h3>
              </div>
              <span className="text-[11px] text-[#5b403d] font-semibold">Actualisé en direct</span>
            </div>

            {/* Donation Cards Feed */}
            <div className="space-y-2">
              {latestDonations.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-[#e7eeff]">
                  <span className="material-symbols-outlined text-[32px] text-[#8f6f6c]">
                    volunteer_activism
                  </span>
                  <p className="text-[14px] font-bold text-[#111c2d] mt-2">
                    Aucun don enregistré pour le moment
                  </p>
                  <p className="text-[12px] text-[#5b403d] mt-0.5">
                    La liste des derniers dons apparaîtra ici dès votre premier enregistrement.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('new')}
                    className="mt-3 inline-flex items-center gap-1 px-3.5 py-2 rounded-full bg-[#af101a] text-white text-[12px] font-bold hover:bg-[#d32f2f] shadow-md active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Enregistrer le premier don
                  </button>
                </div>
              ) : (
                latestDonations.map((don) => {
                  const initials = getInitials(don.donorName);
                  const isReceived = don.status === 'Reçu';

                  return (
                    <div
                      key={don.id}
                      onClick={() => onEditDonation(don)}
                      className="group active:scale-[0.99] transition-transform rounded-2xl bg-white p-3 shadow-xs border border-[#e7eeff] flex items-center justify-between gap-2 cursor-pointer hover:border-[#af101a]/30"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Avatar icon / initials */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[13px] ${
                            isReceived
                              ? 'bg-[#a3f69c]/50 text-[#1b6d24]'
                              : 'bg-[#ffdfa0]/60 text-[#715300]'
                          }`}
                        >
                          {don.isNature ? (
                            <span className="material-symbols-outlined text-[20px]">
                              {don.amount > 0 ? 'redeem' : 'inventory_2'}
                            </span>
                          ) : initials ? (
                            initials
                          ) : (
                            <span className="material-symbols-outlined text-[20px]">payments</span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-[14px] text-[#111c2d] truncate font-bold">
                              {don.donorName}
                            </p>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                don.donorType === 'Sponsor'
                                  ? 'bg-[#ffdfa0] text-[#715300]'
                                  : 'bg-[#f0f3ff] text-[#5b403d]'
                              }`}
                            >
                              {don.donorType}
                            </span>
                          </div>
                          <p className="text-[12px] text-[#5b403d] truncate mt-0.5">
                            {don.isNature && don.natureDescription
                              ? `${don.paymentMethod} • ${don.natureDescription}`
                              : `${don.paymentMethod} • ${formatNumber(don.amount)} FCFA`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isReceived
                              ? 'bg-[#a3f69c] text-[#002204]'
                              : 'bg-[#ffdfa0] text-[#261a00]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isReceived ? 'bg-[#1b6d24]' : 'bg-[#715300]'
                            }`}
                          />
                          {don.status}
                        </span>
                        <DonationActionMenu
                          donation={don}
                          onToggleStatus={onToggleDonationStatus}
                          onEdit={onEditDonation}
                          onDelete={onDeleteDonation}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Button: Voir tous les dons */}
          <div className="pt-2">
            <button
              onClick={() => onNavigate('all-donations')}
              className="w-full h-14 rounded-full bg-[#af101a] text-white font-bold text-[15px] shadow-[0_6px_20px_rgba(175,16,26,0.25)] hover:bg-[#d32f2f] flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">list_alt</span>
              <span>Voir tous les dons ({donations.length})</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
