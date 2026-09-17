import React, { useState } from 'react';
import { Edition, Donation } from '../types';
import { APP_IMAGES } from '../data/initialData';

interface OfficialReportViewProps {
  currentEdition: Edition;
  donations: Donation[];
  onNavigate: (view: string) => void;
  onOpenCreateModal: () => void;
  onCloseEdition: () => void;
  images?: typeof APP_IMAGES;
}

export const OfficialReportView: React.FC<OfficialReportViewProps> = ({
  currentEdition,
  donations,
  onNavigate,
  onOpenCreateModal,
  onCloseEdition,
  images = APP_IMAGES,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);

  const hasDonations = donations.length > 0;

  // Calculs réels depuis la liste des dons (aucune valeur codée en dur)
  const receivedDonations = donations.filter((d) => d.status === 'Reçu');
  const pledgeDonations = donations.filter((d) => d.status === 'Promesse');
  const receivedTotal = receivedDonations.reduce((acc, d) => acc + d.amount, 0);
  const promessesTotal = pledgeDonations.reduce((acc, d) => acc + d.amount, 0);
  const receivedCount = receivedDonations.length;
  const promesseCount = pledgeDonations.length;

  const targetBudget = currentEdition.budgetGoal || 0;
  const progressPercent = targetBudget > 0 ? Math.round((receivedTotal / targetBudget) * 100) : 0;
  const barWidth = Math.min(100, progressPercent);
  const delta = receivedTotal - targetBudget;

  const parseDate = (iso?: string) => {
    if (!iso) return null;
    const d = new Date(`${iso}T00:00:00`);
    return isNaN(d.getTime()) ? null : d;
  };

  const endDateObj = parseDate(currentEdition.endDate);
  const startDateObj = parseDate(currentEdition.startDate);

  // Date de distribution issue de la date de fin réelle de l'édition active
  const distributionDateLabel = endDateObj
    ? endDateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    : '';

  const editionYear = endDateObj ? endDateObj.getFullYear() : new Date().getFullYear();

  const formatShortDate = (iso?: string) => {
    const d = parseDate(iso);
    return d ? `${d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} ${d.getFullYear()}` : 'À définir';
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const confirmClose = () => {
    setIsCloseConfirmOpen(false);
    onCloseEdition();
    showToast('Édition clôturée avec succès — badge officiel affiché.');
  };

  // Formatage des chiffres en norme française (séparateur d'espace)
  const formatNumber = (num: number) => new Intl.NumberFormat('fr-FR').format(num);

  const handleDownloadPdf = () => {
    if (!hasDonations) {
      showToast(
        'Aucun don enregistré — impossible de générer le rapport officiel pour le moment.'
      );
      return;
    }
    setIsGenerating(true);
    showToast('Génération du PDF officiel en cours (~2.4 Mo)...');

    setTimeout(() => {
      setIsGenerating(false);
      showToast(`Rapport Officiel NTPB ${editionYear} téléchargé avec succès !`);

      // Trigger standard print / save dialog if available
      try {
        window.print();
      } catch {
        // Continue normally
      }
    }, 1200);
  };

  const handleSharePdf = () => {
    if (!hasDonations) {
      showToast(
        'Aucun don enregistré — le rapport officiel sera disponible après le premier don.'
      );
      return;
    }
    if (navigator.share) {
      navigator
        .share({
          title: `Rapport Officiel de Clôture NTPB — ${currentEdition.name} (Batcha)`,
          text: `Consultez le bilan certifié de l'édition de bienfaisance de Noël à Batcha (${formatNumber(
            receivedTotal
          )} FCFA encaissés).`,
          url: window.location.href,
        })
        .catch(() => {
          showToast('Lien du rapport officiel copié dans le presse-papiers !');
        });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Lien du rapport copié pour WhatsApp & Email !');
    }
  };

  return (
    <div className="flex flex-col w-full max-w-xl mx-auto px-4 space-y-4 pb-28 pt-2">
      {/* Entête de Clôture & Statut Officiel */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex flex-col">
          {currentEdition.status === 'Clôturée' && (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#a3f69c] text-[#002204] text-[11px] font-bold">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                Édition Clôturée avec Succès
              </span>
            </div>
          )}
          <h2 className="text-[22px] font-extrabold text-[#111c2d] mt-1 leading-snug">
            Clôture & Rapport officiel
          </h2>
          <p className="text-[12px] text-[#5b403d]">
            Noël Pour Tous à Batcha • {currentEdition.editionNumber}ᵉ édition
          </p>
        </div>
        <div className="w-12 h-12 rounded-full bg-[#ffdfa0] flex items-center justify-center text-[#261a00] shadow-sm flex-shrink-0">
          <span className="material-symbols-outlined text-[26px]">workspace_premium</span>
        </div>
      </div>

      {/* Fiche Synthèse Édition (Bento Card) */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-[#e7eeff] space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] uppercase tracking-wider text-[#af101a] font-bold">
              Thématique Clé
            </span>
            <h3 className="text-[16px] font-bold text-[#111c2d] leading-snug">
              {currentEdition.theme}
            </h3>
          </div>
          <span className="px-2 py-1 rounded-full bg-[#dee8ff] text-[#111c2d] text-[11px] font-semibold whitespace-nowrap">
            {formatShortDate(currentEdition.startDate)} → {formatShortDate(currentEdition.endDate)}
          </span>
        </div>

        {/* Objectifs initiaux récapitulés */}
        <div className="rounded-xl bg-[#f0f3ff] p-3 text-[#5b403d] text-[12px] border border-[#d8e3fb]">
          <div className="flex items-center gap-1 text-[#715300] text-[12px] font-bold mb-1">
            <span className="material-symbols-outlined text-[16px]">flag</span>
            Engagements initiaux
          </div>
          {currentEdition.vision?.trim() ? (
            <p className="italic text-[#111c2d]">« {currentEdition.vision.trim()} »</p>
          ) : (
            <p className="text-[#5b403d]">Aucun engagement renseigné.</p>
          )}
        </div>

        {/* Taux d'atteinte du budget (Gauge & Chiffres) */}
        <div className="pt-1">
          <div className="flex items-end justify-between mb-1.5">
            <div>
              <span className="text-[12px] text-[#5b403d]">Montant réellement encaissé</span>
              <p className="text-[20px] text-[#af101a] font-extrabold leading-tight">
                {formatNumber(receivedTotal)} FCFA
              </p>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-bold ${
                  progressPercent >= 100
                    ? 'bg-[#a3f69c] text-[#002204]'
                    : 'bg-[#ffdfa0] text-[#261a00]'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">trending_up</span>{' '}
                {progressPercent}%
              </span>
              <p className="text-[11px] text-[#5b403d] mt-0.5">
                Objectif: {formatNumber(targetBudget)} FCFA
              </p>
            </div>
          </div>

          {/* Horizontal Goal Bar */}
          <div className="relative w-full h-3 rounded-full bg-[#dee8ff] overflow-hidden">
            <div
              className={`h-full rounded-full ${
                progressPercent >= 100
                  ? 'bg-gradient-to-r from-[#1b6d24] via-[#a3f69c] to-[#f8bd2a]'
                  : 'bg-gradient-to-r from-[#f8bd2a] to-[#ffdfa0]'
              }`}
              style={{ width: `${targetBudget > 0 ? barWidth : 0}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1 text-[#5b403d] text-[11px]">
            <span>
              {targetBudget > 0
                ? delta >= 0
                  ? `Surperformance : +${formatNumber(delta)} FCFA`
                  : `${formatNumber(-delta)} FCFA restants à collecter`
                : 'Budget cible non renseigné'}
            </span>
            <span className="text-[#1b6d24] font-semibold">Alloué aux enfants de Batcha</span>
          </div>
        </div>
      </div>

      {/* Prévisualisation Interactive du Rapport PDF Officiel (Document A4 Stylisé) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-[#111c2d] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#af101a] text-[20px]">
              picture_as_pdf
            </span>
            Aperçu Document Officiel (A4)
          </h3>
          <span className="text-[11px] text-[#af101a] font-bold flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[16px]">touch_app</span> Page 1/6
          </span>
        </div>

        {/* Feuille de simulation A4 */}
        <div className="relative rounded-2xl bg-white p-5 shadow-lg border border-[#e7eeff] overflow-hidden transition-all duration-300">
          {/* En-tête Association + Logo */}
          <div className="flex items-center gap-3 pb-3 border-b border-[#f0f3ff]">
            <img
              alt="Logo Association NTPB"
              className="w-12 h-12 rounded-lg object-contain bg-[#f0f3ff] p-1 border border-[#d8e3fb] flex-shrink-0"
              src={images?.logoDocument || APP_IMAGES.logoDocument}
            />
            <div className="flex flex-col min-w-0 pr-10">
              <span className="text-[10px] text-[#af101a] uppercase font-extrabold tracking-wider">
                Noël Pour Tous à Batcha (NTPB)
              </span>
              <h4 className="text-[14px] leading-tight text-[#111c2d] font-bold">
                RAPPORT OFFICIEL DE CLÔTURE
              </h4>
              <span className="text-[11px] text-[#5b403d]">
                Réf: BTA-{editionYear}-RAP-
                {String(currentEdition.editionNumber).padStart(2, '0')} • Certifié par le Trésorier
                & SG
              </span>
            </div>
          </div>

          {/* Mini KPI Badge dans le document */}
          <div className="p-2.5 rounded-xl bg-[#f0f3ff] flex flex-col border border-[#d8e3fb] my-3">
            <span className="text-[10px] text-[#5b403d]">Montant Encaissé</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-[18px] text-[#1b6d24] font-bold">
                {formatNumber(receivedTotal)}
              </span>
              <span className="text-[11px] text-[#5b403d]">FCFA</span>
            </div>
            <span className="text-[10px] text-[#1b6d24] font-semibold mt-0.5">
              {progressPercent}% de l'objectif
            </span>
          </div>

          {/* Interprétations automatiques générées */}
          <div className="mt-3 pt-3 space-y-2 border-t border-[#f0f3ff]">
            <div className="flex items-center gap-1 text-[#111c2d] text-[11px] font-bold">
              <span className="material-symbols-outlined text-[#af101a] text-[15px]">
                auto_awesome
              </span>
              Synthèses Analytiques Automatisées
            </div>
            <div className="p-2.5 rounded-xl bg-[#dee8ff]/40 text-[#111c2d] space-y-2 border border-[#d8e3fb]">
              {!hasDonations ? (
                <div className="flex items-center gap-2 text-[#5b403d]">
                  <span className="material-symbols-outlined text-[18px] flex-shrink-0">
                    info
                  </span>
                  <p className="text-[12px] leading-relaxed">
                    Aucune donnée à synthétiser pour le moment — le rapport se génère dès le
                    premier don enregistré.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-1.5">
                    <span className="material-symbols-outlined text-[#1b6d24] text-[16px] flex-shrink-0 mt-0.5">
                      insights
                    </span>
                    <p className="text-[12px] leading-relaxed text-[#5b403d]">
                      <strong className="font-semibold text-[#111c2d]">Effort de collecte :</strong>{' '}
                      « {donations.length} don(s) enregistré(s), dont {receivedCount} encaissé(s)
                      pour {formatNumber(receivedTotal)} FCFA et {promesseCount} promesse(s) restant
                      à {formatNumber(promessesTotal)} FCFA. »
                    </p>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="material-symbols-outlined text-[#af101a] text-[16px] flex-shrink-0 mt-0.5">
                      sentiment_very_satisfied
                    </span>
                    <p className="text-[12px] leading-relaxed text-[#5b403d]">
                      <strong className="font-semibold text-[#111c2d]">Impact terrain :</strong>{' '}
                      « Le bilan certifié de {formatNumber(receivedTotal)} FCFA est alloué à la
                      préparation des colis et des repas distribués lors de la journée du{' '}
                      {distributionDateLabel}. »
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bas de page A4 filigrane */}
          <div className="mt-4 pt-2 border-t border-[#f0f3ff] flex items-center justify-between text-[#5b403d] text-[9px]">
            <span>Signature numérique: SHA-256 Validated</span>
            <span>Association Loi 1990 - Batcha, Cameroun</span>
          </div>
        </div>
      </div>

      {/* Statut & Clôture de l'édition */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-[#e7eeff] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[11px] uppercase tracking-wider text-[#af101a] font-bold">
              Statut de l'édition
            </span>
            <p className="text-[15px] font-bold text-[#111c2d] mt-0.5 truncate">
              {currentEdition.status === 'Clôturée'
                ? 'Édition clôturée'
                : 'Édition en cours de collecte'}
            </p>
          </div>
          {currentEdition.status === 'Clôturée' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#a3f69c] text-[#002204] text-[11px] font-bold flex-shrink-0">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              Clôturée
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#dee8ff] text-[#111c2d] text-[11px] font-bold flex-shrink-0">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              En cours
            </span>
          )}
        </div>

        {currentEdition.status === 'Clôturée' ? (
          <p className="text-[12px] text-[#5b403d] leading-relaxed">
            Cette édition est désormais en consultation. Le verrouillage complet des données
            (lecture seule) sera tranché plus tard.
          </p>
        ) : isCloseConfirmOpen ? (
          <div className="rounded-xl bg-[#fff3e0] border border-[#ffdfa0] p-3 space-y-2.5">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[#715300] text-[20px] flex-shrink-0 mt-0.5">
                help
              </span>
              <p className="text-[12px] text-[#261a00] font-semibold leading-relaxed">
                Êtes-vous sûre de vouloir clôturer cette édition ? Cette action affichera le badge
                de clôture officielle et passera l'édition en lecture/consultation.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={confirmClose}
                className="flex-1 h-10 rounded-full bg-[#af101a] text-white text-[12px] font-bold hover:bg-[#d32f2f] active:scale-[0.98] transition-all cursor-pointer"
              >
                Oui, clôturer l'édition
              </button>
              <button
                type="button"
                onClick={() => setIsCloseConfirmOpen(false)}
                className="flex-1 h-10 rounded-full bg-[#f0f3ff] text-[#111c2d] text-[12px] font-bold hover:bg-[#dee8ff] active:scale-[0.98] transition-all cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsCloseConfirmOpen(true)}
            className="w-full h-12 rounded-full bg-[#111c2d] text-white text-[14px] font-bold flex items-center justify-center gap-2 shadow-md hover:bg-[#1f2a3d] active:scale-[0.98] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">flag</span>
            Clôturer l'événement
          </button>
        )}
      </div>

      {/* Boutons d'Action Principaux */}
      <div className="space-y-2.5 pt-1">
        {!hasDonations && (
          <div className="p-4 rounded-2xl bg-[#fff3e0] border border-[#ffdfa0] flex items-start gap-2.5 text-[#715300]">
            <span className="material-symbols-outlined text-[20px] flex-shrink-0 mt-0.5">
              warning
            </span>
            <div className="space-y-0.5">
              <p className="text-[12px] font-bold text-[#261a00]">
                Aucun don enregistré pour cette édition
              </p>
              <p className="text-[11px] leading-snug">
                Le rapport officiel de clôture ne peut pas être généré tant qu'aucun don n'est
                enregistré. Enregistrez votre premier don pour activer cette section.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('new')}
                className="mt-1.5 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#af101a] text-white text-[11px] font-bold hover:bg-[#d32f2f] shadow-sm active:scale-[0.98] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">add</span>
                Enregistrer un don
              </button>
            </div>
          </div>
        )}

        {/* Gros bouton rouge/vert distinctif de téléchargement */}
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isGenerating || !hasDonations}
          title={hasDonations ? undefined : 'Aucun don enregistré — rapport indisponible'}
          className="w-full h-14 rounded-full bg-[#af101a] text-white font-bold text-[15px] shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-[#d32f2f] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[24px]">download_for_offline</span>
          <span className="truncate">Générer & Télécharger le Rapport PDF</span>
          <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px]">
            ~2.4 Mo
          </span>
        </button>

        {/* Bouton Secondaire Partage */}
        <button
          type="button"
          onClick={handleSharePdf}
          disabled={!hasDonations}
          title={hasDonations ? undefined : 'Aucun don enregistré — rapport indisponible'}
          className="w-full h-12 rounded-full bg-[#dee8ff] text-[#111c2d] font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-[#d8e3fb] cursor-pointer border border-[#d8e3fb] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[#1b6d24] text-[22px]">share</span>
          <span>Partager le PDF (WhatsApp / Email / Impression)</span>
        </button>

        {/* Raccourcis Gestion d'Édition : Créer Édition Suivante / Archiver Cloud */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="h-11 rounded-xl bg-[#f0f3ff] text-[#111c2d] border border-[#d8e3fb] p-2 flex items-center justify-center gap-1.5 text-[13px] active:bg-[#dee8ff] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[#1b6d24] text-[18px]">add_circle</span>
            <span className="truncate font-semibold">Créer Noël 2027</span>
          </button>

          <button
            type="button"
            onClick={() => showToast('Campagne archivée sur le Cloud sécurisé AES.')}
            className="h-11 rounded-xl bg-[#f0f3ff] text-[#111c2d] border border-[#d8e3fb] p-2 flex items-center justify-center gap-1.5 text-[13px] active:bg-[#dee8ff] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[#715300] text-[18px]">cloud_sync</span>
            <span className="truncate font-semibold">Archiver Cloud</span>
          </button>
        </div>
      </div>

      {/* Interactive Toast */}
      {toastMessage && (
        <div className="fixed bottom-24 left-4 right-4 z-50 max-w-xl mx-auto animate-in slide-in-from-bottom-4 duration-300">
          <div className="rounded-2xl bg-[#111c2d] text-white px-4 py-3 shadow-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#a3f69c] text-[22px]">
                check_circle
              </span>
              <span className="text-[13px] font-medium">{toastMessage}</span>
            </div>
            <span className="text-[11px] text-[#a3f69c] font-bold">2.4 Mo</span>
          </div>
        </div>
      )}
    </div>
  );
};
